import { Hono } from 'hono';
import { z } from 'zod';
import prisma from '@/app/api/utils/prisma';

const reportsRouter = new Hono();

// Query schema for list endpoint
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  studentId: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).default('ALL'),
  sortBy: z.enum(['date', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/admin/reports
 * List reports with filters and pagination
 * Includes student info and feedback
 */
reportsRouter.get('/', async (c) => {
    try {
      const parsed = listQuerySchema.safeParse(c.req.query());
      if (!parsed.success) {
        return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
      }
      const { page, pageSize, studentId, status, sortBy, sortOrder } = parsed.data;
      const skip = (page - 1) * pageSize;

      // Build where clause
      const where: any = {};

      if (studentId) {
        where.studentId = studentId;
      }

      if (status !== 'ALL') {
        where.status = status;
      }

      // Fetch reports with student and feedback
      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          select: {
            id: true,
            date: true,
            subject: true,
            testSource: true,
            testCount: true,
            studyDurationMinutes: true,
            description: true,
            fileUrl: true,
            status: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                name: true,
                phone: true,
                grade: true,
                field: true,
                profileImageUrl: true,
              },
            },
            feedback: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                admin: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: pageSize,
        }),
        prisma.report.count({ where }),
      ]);

      return c.json({
        items: reports,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      return c.json({ error: 'Failed to fetch reports' }, 500);
    }
  });

/**
 * GET /api/admin/reports/:reportId
 * Get full report details with student and feedback
 */
reportsRouter.get('/:reportId', async (c) => {
  try {
    const { reportId } = c.req.param();

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        date: true,
        subject: true,
        testSource: true,
        testCount: true,
        studyDurationMinutes: true,
        description: true,
        fileUrl: true,
        status: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            name: true,
            phone: true,
            grade: true,
            field: true,
            city: true,
            profileImageUrl: true,
          },
        },
        feedback: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            admin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    return c.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return c.json({ error: 'Failed to fetch report' }, 500);
  }
});

// Body schema for feedback
const feedbackSchema = z.object({
  content: z.string().min(1, 'Feedback content is required').max(2000),
  decision: z.enum(['APPROVED', 'REJECTED']),
});

/**
 * POST /api/admin/reports/:reportId/feedback
 * Create or update feedback for a report
 * Updates report status based on decision
 */
reportsRouter.post('/:reportId/feedback', async (c) => {
    try {
      const { reportId } = c.req.param();
      const body = await c.req.json().catch(() => ({}));
      const parsed = feedbackSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
      }
      const { content, decision } = parsed.data;
      const adminId = c.get('adminId') as string;

      // Check if report exists
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          status: true,
          feedback: { select: { id: true } },
        },
      });

      if (!report) {
        return c.json({ error: 'Report not found' }, 404);
      }

      // Use transaction to ensure consistency
      const result = await prisma.$transaction(async (tx) => {
        // Upsert feedback
        const feedback = await tx.feedback.upsert({
          where: { reportId },
          create: {
            reportId,
            adminId,
            content,
          },
          update: {
            content,
            adminId,
          },
        });

        // Update report status based on decision
        const updatedReport = await tx.report.update({
          where: { id: reportId },
          data: { status: decision },
          select: {
            id: true,
            date: true,
            subject: true,
            testSource: true,
            testCount: true,
            studyDurationMinutes: true,
            description: true,
            fileUrl: true,
            status: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                name: true,
                phone: true,
                grade: true,
                field: true,
              },
            },
            feedback: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                admin: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        return updatedReport;
      });

      console.log(
        `[Admin ${adminId}] Added feedback to report ${reportId} with decision: ${decision}`
      );

      return c.json({
        success: true,
        report: result,
        message: decision === 'APPROVED' 
          ? 'گزارش تایید و بازخورد ثبت شد' 
          : 'گزارش رد و بازخورد ثبت شد',
      });
    } catch (error) {
      console.error('Error adding feedback:', error);
      
      // Handle unique constraint violation (shouldn't happen with upsert, but just in case)
      if ((error as any).code === 'P2002') {
        return c.json(
          { error: 'Feedback already exists for this report' },
          409
        );
      }
      
      return c.json({ error: 'Failed to add feedback' }, 500);
    }
  });

/**
 * DELETE /api/admin/reports/:reportId
 * Delete a report (optional, for admin cleanup)
 */
reportsRouter.delete('/:reportId', async (c) => {
  try {
    const { reportId } = c.req.param();
    const adminId = c.get('adminId') as string;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    await prisma.report.delete({
      where: { id: reportId },
    });

    console.log(`[Admin ${adminId}] Deleted report ${reportId}`);

    return c.json({
      success: true,
      message: 'گزارش با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return c.json({ error: 'Failed to delete report' }, 500);
  }
});

export default reportsRouter;
