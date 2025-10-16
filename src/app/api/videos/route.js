import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    // Try to read session, but do not require it for listing videos
    let session = null;
    try {
      session = await auth();
    } catch {}

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Build where clause conditionally (only apply when provided)
    const where = {};
    if (category && category.trim()) {
      where.category = category.trim();
    }

    // Get current user only if we have a session
    let currentUser = null;
    if (session?.user?.id) {
      currentUser = await prisma.user.findUnique({ where: { id: session.user.id } }).catch(() => null);
    }

    // Fetch videos using Prisma
    const videos = await prisma.video.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        videoUrl: true,
        thumbnailUrl: true,
        videoTitle: true,
        videoDescription: true,
        views: true,
        createdAt: true,
        // فیلدهای پیش‌نمایش غنی برای داشبورد دانش‌آموز
        previewTitle: true,
        previewDescription: true,
        previewImage: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
        // Only check if current user liked when we have a user
        likes: currentUser ? {
          where: { userId: currentUser.id },
          select: { id: true },
        } : false,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform to match expected format for frontend
    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      category: video.category,
      video_url: video.videoUrl,
      thumbnail_url: video.thumbnailUrl,
      video_title: video.videoTitle,
      description: video.videoDescription,
      created_at: video.createdAt,
      uploader_name: video.uploadedBy?.name || 'نامشخص',
      views: video.views || 0,
      like_count: video._count?.likes || 0,
      user_liked: Array.isArray(video.likes) ? video.likes.length > 0 : false,
      // فیلدهای پیش‌نمایش غنی
      preview_title: video.previewTitle,
      preview_description: video.previewDescription,
      preview_image: video.previewImage,
      // For compatibility
      comment_count: 0,
    }));

    return Response.json({ videos: formattedVideos });

  } catch (error) {
    console.error('Get videos error:', error);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    // For backward compatibility this endpoint is used by legacy advisor upload UI.
    const { title, description, video_url, category } = await request.json();

    if (!title || !video_url || !category) {
      return Response.json({ 
        error: 'عنوان، لینک ویدیو و دسته‌بندی الزامی است' 
      }, { status: 400 });
    }

    // Only allow admins/advisors to upload via this endpoint
    // We assume ADMIN acts as advisor in the new system
    if (session.user.role !== 'ADMIN') {
      return Response.json({ error: 'فقط مشاور/مدیر می‌تواند ویدیو آپلود کند' }, { status: 403 });
    }

    const created = await prisma.video.create({
      data: {
        title,
        category,
        videoUrl: video_url,
        videoTitle: null,
        videoDescription: description || null,
        uploadedById: session.user.id,
      },
      select: { id: true },
    });

    return Response.json({ 
      message: 'ویدیو با موفقیت آپلود شد',
      video: { id: created.id }
    });

  } catch (error) {
    console.error('Upload video error:', error);
    return Response.json({ error: 'خطای سرور در آپلود ویدیو' }, { status: 500 });
  }
}