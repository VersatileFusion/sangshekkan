import { Hono } from 'hono';
import { z } from 'zod';
import prisma from '@/app/api/utils/prisma';
import { getLinkPreview } from 'link-preview-js';

const videosRouter = new Hono();

// Helper function to fetch link preview
async function fetchLinkPreview(url: string) {
  try {
    const previewData = await getLinkPreview(url, {
      timeout: 5000,
      followRedirects: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    return {
      previewTitle: previewData.title || null,
      previewDescription: previewData.description || null,
      previewImage: (previewData.images && previewData.images[0]) || 
                    (previewData.favicons && previewData.favicons[0]) || 
                    null,
    };
  } catch (error) {
    console.error('خطا در استخراج پیش‌نمایش لینک:', error);
    // اگر استخراج ناموفق بود، مقادیر null برگردان
    return {
      previewTitle: null,
      previewDescription: null,
      previewImage: null,
    };
  }
}

// Query schema for list endpoint
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
});

// Body schemas for create/update
const videoBodySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  category: z.string().min(1, 'Category is required').max(100),
  videoUrl: z.string().url('Invalid video URL'),
  thumbnailUrl: z.string().optional(),
  videoTitle: z.string().optional(),
  videoDescription: z.string().optional(),
});

/**
 * GET /api/admin/videos
 * List all videos with optional pagination and category filter
 */
videosRouter.get('/', async (c) => {
    try {
      const parsed = listQuerySchema.safeParse(c.req.query());
      if (!parsed.success) {
        return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
      }
      const { page, pageSize, category } = parsed.data;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (category && category.trim()) {
        where.category = category.trim();
      }

      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          where,
          select: {
            id: true,
            title: true,
            category: true,
            videoUrl: true,
            thumbnailUrl: true,
            videoTitle: true,
            videoDescription: true,
            createdAt: true,
            uploadedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.video.count({ where }),
      ]);

      return c.json({
        items: videos,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
      return c.json({ error: 'Failed to fetch videos' }, 500);
    }
  });

/**
 * GET /api/admin/videos/:videoId
 * Get video by ID
 */
videosRouter.get('/:videoId', async (c) => {
  try {
    const { videoId } = c.req.param();

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        category: true,
        videoUrl: true,
        createdAt: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }

    return c.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    return c.json({ error: 'Failed to fetch video' }, 500);
  }
});

/**
 * POST /api/admin/videos
 * Create a new video
 */
videosRouter.post('/', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const parsed = videoBodySchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
      }
      const data = parsed.data;
      const adminId = c.get('adminId') as string;

      // استخراج پیش‌نمایش لینک (عنوان، توضیحات، تصویر)
      const previewData = await fetchLinkPreview(data.videoUrl);

      const video = await prisma.video.create({
        data: {
          title: data.title,
          category: data.category,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
          videoTitle: data.videoTitle,
          videoDescription: data.videoDescription,
          // اضافه کردن داده‌های پیش‌نمایش استخراج شده
          previewTitle: previewData.previewTitle,
          previewDescription: previewData.previewDescription,
          previewImage: previewData.previewImage,
          uploadedById: adminId,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      console.log(`[Admin ${adminId}] Created video ${video.id}`);

      return c.json(
        {
          success: true,
          video,
          message: 'ویدیو با موفقیت ایجاد شد',
        },
        201
      );
    } catch (error) {
      console.error('Error creating video:', error);
      return c.json({ error: 'Failed to create video' }, 500);
    }
  });

/**
 * PUT /api/admin/videos/:videoId
 * Update an existing video
 */
videosRouter.put('/:videoId', async (c) => {
    try {
      const { videoId } = c.req.param();
      const body = await c.req.json().catch(() => ({}));
      const parsed = videoBodySchema.partial().safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
      }
      const data = parsed.data;
      const adminId = c.get('adminId') as string;

      // Check if video exists
      const existing = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!existing) {
        return c.json({ error: 'Video not found' }, 404);
      }

      // Build update data
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
      if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
      if (data.videoTitle !== undefined) updateData.videoTitle = data.videoTitle;
      if (data.videoDescription !== undefined) updateData.videoDescription = data.videoDescription;

      // اگر URL ویدیو تغییر کرده، پیش‌نمایش جدید را استخراج کن
      if (data.videoUrl !== undefined) {
        const previewData = await fetchLinkPreview(data.videoUrl);
        updateData.previewTitle = previewData.previewTitle;
        updateData.previewDescription = previewData.previewDescription;
        updateData.previewImage = previewData.previewImage;
      }

      const video = await prisma.video.update({
        where: { id: videoId },
        data: updateData,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      console.log(`[Admin ${adminId}] Updated video ${videoId}`);

      return c.json({
        success: true,
        video,
        message: 'ویدیو با موفقیت به‌روزرسانی شد',
      });
    } catch (error) {
      console.error('Error updating video:', error);
      return c.json({ error: 'Failed to update video' }, 500);
    }
  });

/**
 * DELETE /api/admin/videos/:videoId
 * Delete a video
 */
videosRouter.delete('/:videoId', async (c) => {
  try {
    const { videoId } = c.req.param();
    const adminId = c.get('adminId') as string;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }

    await prisma.video.delete({
      where: { id: videoId },
    });

    console.log(`[Admin ${adminId}] Deleted video ${videoId}`);

    return c.json({
      success: true,
      message: 'ویدیو با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return c.json({ error: 'Failed to delete video' }, 500);
  }
});

/**
 * GET /api/admin/videos/categories
 * Get list of all unique video categories
 */
videosRouter.get('/categories/list', async (c) => {
  try {
    const categories = await prisma.video.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return c.json({
      categories: categories.map((v) => v.category),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

export default videosRouter;
