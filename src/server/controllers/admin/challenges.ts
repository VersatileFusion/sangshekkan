import { Hono } from 'hono';
import { z } from 'zod';
import prisma from '@/app/api/utils/prisma';

const challengesRouter = new Hono();

// Query schema for list endpoint
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  isActive: z.enum(['true', 'false', 'all']).default('all'),
});

// Body schemas for create/update
const challengeBodySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  isActive: z.boolean().default(true),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end date',
  }),
});

/**
 * GET /api/admin/challenges
 * List all challenges with optional pagination and active filter
 */
challengesRouter.get('/', async (c) => {
    try {
      const parsed = listQuerySchema.safeParse(c.req.query());
      if (!parsed.success) {
        return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
      }
      const { page, pageSize, isActive } = parsed.data;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (isActive === 'true') {
        where.isActive = true;
      } else if (isActive === 'false') {
        where.isActive = false;
      }

      const [challenges, total] = await Promise.all([
        prisma.challenge.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            isActive: true,
            startDate: true,
            endDate: true,
            _count: {
              select: {
                participations: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.challenge.count({ where }),
      ]);

      const items = challenges.map((challenge) => ({
        ...challenge,
        participationsCount: challenge._count.participations,
        _count: undefined,
      }));

      return c.json({
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return c.json({ error: 'Failed to fetch challenges' }, 500);
    }
  });

/**
 * GET /api/admin/challenges/:challengeId
 * Get challenge by ID with participation details
 */
challengesRouter.get('/:challengeId', async (c) => {
  try {
    const { challengeId } = c.req.param();

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        title: true,
        description: true,
        isActive: true,
        startDate: true,
        endDate: true,
        _count: {
          select: {
            participations: true,
          },
        },
      },
    });

    if (!challenge) {
      return c.json({ error: 'Challenge not found' }, 404);
    }

    return c.json({
      ...challenge,
      participationsCount: challenge._count.participations,
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return c.json({ error: 'Failed to fetch challenge' }, 500);
  }
});

/**
 * POST /api/admin/challenges
 * Create a new challenge
 */
challengesRouter.post('/', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const parsed = challengeBodySchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
      }
      const data = parsed.data;
      const adminId = c.get('adminId') as string;

      const challenge = await prisma.challenge.create({
        data: {
          title: data.title,
          description: data.description,
          isActive: data.isActive,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      });

      console.log(`[Admin ${adminId}] Created challenge ${challenge.id}`);

      return c.json(
        {
          success: true,
          challenge,
          message: 'چالش با موفقیت ایجاد شد',
        },
        201
      );
    } catch (error) {
      console.error('Error creating challenge:', error);
      return c.json({ error: 'Failed to create challenge' }, 500);
    }
  });

/**
 * PUT /api/admin/challenges/:challengeId
 * Update an existing challenge
 */
challengesRouter.put('/:challengeId', async (c) => {
    try {
      const { challengeId } = c.req.param();
      const body = await c.req.json().catch(() => ({}));
      const parsed = challengeBodySchema.partial().safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
      }
      const data = parsed.data;
      const adminId = c.get('adminId') as string;

      // Check if challenge exists
      const existing = await prisma.challenge.findUnique({
        where: { id: challengeId },
      });

      if (!existing) {
        return c.json({ error: 'Challenge not found' }, 404);
      }

      // Build update data
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.startDate) updateData.startDate = new Date(data.startDate);
      if (data.endDate) updateData.endDate = new Date(data.endDate);

      const challenge = await prisma.challenge.update({
        where: { id: challengeId },
        data: updateData,
      });

      console.log(`[Admin ${adminId}] Updated challenge ${challengeId}`);

      return c.json({
        success: true,
        challenge,
        message: 'چالش با موفقیت به‌روزرسانی شد',
      });
    } catch (error) {
      console.error('Error updating challenge:', error);
      return c.json({ error: 'Failed to update challenge' }, 500);
    }
  });

/**
 * DELETE /api/admin/challenges/:challengeId
 * Delete a challenge
 */
challengesRouter.delete('/:challengeId', async (c) => {
  try {
    const { challengeId } = c.req.param();
    const adminId = c.get('adminId') as string;

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return c.json({ error: 'Challenge not found' }, 404);
    }

    await prisma.challenge.delete({
      where: { id: challengeId },
    });

    console.log(`[Admin ${adminId}] Deleted challenge ${challengeId}`);

    return c.json({
      success: true,
      message: 'چالش با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return c.json({ error: 'Failed to delete challenge' }, 500);
  }
});

export default challengesRouter;
