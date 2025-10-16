import { Hono } from 'hono';
import { z } from 'zod';
import prisma from '@/app/api/utils/prisma';

const studentsRouter = new Hono();

// Query schema for list endpoint
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(28),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ALL']).default('ALL'),
});

/**
 * GET /api/admin/students
 * List all students with pagination, search, and status filter
 * Returns pendingReportsCount for each student
 */
studentsRouter.get('/', async (c) => {
    try {
      const parsed = listQuerySchema.safeParse(c.req.query());
      if (!parsed.success) {
        return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
      }
      const { page, pageSize, search, status } = parsed.data;
      const skip = (page - 1) * pageSize;

      // Build where clause
      const where: any = {
        role: 'STUDENT',
      };

      // Status filter
      if (status === 'ACTIVE') {
        where.status = 'ACTIVE';
        where.accessSuspendedAt = null;
      } else if (status === 'SUSPENDED') {
        where.OR = [
          { status: 'SUSPENDED' },
          { accessSuspendedAt: { not: null } },
        ];
      }

      // Search filter (name or phone)
      if (search && search.trim()) {
        where.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { phone: { contains: search.trim() } },
        ];
      }

      // Fetch students with selected fields
      const [students, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            phone: true,
            grade: true,
            field: true,
            city: true,
            profileImageUrl: true,
            status: true,
            accessSuspendedAt: true,
            createdAt: true,
            pinned: true,
            _count: {
              select: {
                reports: {
                  where: { status: 'PENDING' },
                },
              },
            },
          },
          orderBy: [
            { pinned: 'desc' }, // Pinned users first
            { createdAt: 'desc' },
          ],
          skip,
          take: pageSize,
        }),
        prisma.user.count({ where }),
      ]);

      // Transform to include pendingReportsCount
      const items = students.map((student) => ({
        id: student.id,
        name: student.name,
        phone: student.phone,
        grade: student.grade,
        field: student.field,
        city: student.city,
        profileImageUrl: student.profileImageUrl,
        status: student.status,
        accessSuspendedAt: student.accessSuspendedAt,
        createdAt: student.createdAt,
        pinned: student.pinned,
        pendingReportsCount: student._count.reports,
      }));

      return c.json({
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      return c.json(
        { error: 'Failed to fetch students' },
        500
      );
    }
  });

/**
 * GET /api/admin/students/:studentId
 * Get detailed student profile
 */
studentsRouter.get('/:studentId', async (c) => {
  try {
    const { studentId } = c.req.param();

    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        phone: true,
        grade: true,
        field: true,
        city: true,
        profileImageUrl: true,
        status: true,
        accessSuspendedAt: true,
        phoneVerifiedAt: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            reports: true,
            challengeParticipations: true,
          },
        },
      },
    });

    if (!student) {
      return c.json({ error: 'Student not found' }, 404);
    }

    return c.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    return c.json({ error: 'Failed to fetch student' }, 500);
  }
});

/**
 * GET /api/admin/students/:studentId/reports-history
 * Returns all reports for a given student along with admin feedbacks
 * Sorted by report.createdAt desc (newest first)
 */
studentsRouter.get('/:studentId/reports-history', async (c) => {
  try {
    const { studentId } = c.req.param();

    // Ensure student exists (and is a STUDENT)
    const exists = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
      select: { id: true },
    });

    if (!exists) {
      return c.json({ error: 'Student not found' }, 404);
    }

    const reportsHistory = await prisma.report.findMany({
      where: { studentId },
      include: {
        feedback: {
          include: {
            admin: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({ reportsHistory });
  } catch (error) {
    console.error('Error fetching reports history:', error);
    return c.json({ error: 'Failed to fetch reports history' }, 500);
  }
});

// Body schema for toggle suspension
const toggleSuspensionSchema = z.object({
  suspend: z.boolean(),
  reason: z.string().optional(),
});

/**
 * POST /api/admin/students/:studentId/toggle-suspension
 * Toggle student suspension status
 * Sets/clears accessSuspendedAt and updates status
 */
studentsRouter.post('/:studentId/toggle-suspension', async (c) => {
    try {
      const { studentId } = c.req.param();
      const body = await c.req.json().catch(() => ({}));
      const parsed = toggleSuspensionSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
      }
      const { suspend } = parsed.data;
      const adminId = c.get('adminId') as string;

      // Check if student exists
      const student = await prisma.user.findUnique({
        where: { id: studentId, role: 'STUDENT' },
      });

      if (!student) {
        return c.json({ error: 'Student not found' }, 404);
      }

      // Update student suspension status
      const updatedStudent = await prisma.user.update({
        where: { id: studentId },
        data: {
          accessSuspendedAt: suspend ? new Date() : null,
          status: suspend ? 'SUSPENDED' : 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          status: true,
          accessSuspendedAt: true,
        },
      });

      console.log(
        `[Admin ${adminId}] ${suspend ? 'Suspended' : 'Unsuspended'} student ${studentId}`
      );

      return c.json({
        success: true,
        student: updatedStudent,
        message: suspend
          ? 'دانش‌آموز با موفقیت مسدود شد'
          : 'مسدودیت دانش‌آموز برداشته شد',
      });
    } catch (error) {
      console.error('Error toggling suspension:', error);
      return c.json({ error: 'Failed to toggle suspension' }, 500);
    }
  });

export default studentsRouter;
