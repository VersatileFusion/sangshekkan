import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

/**
 * GET /api/content - دریافت لیست محتواهای ادمین
 * همراه با اطلاعات لایک و اینکه کاربر فعلی لایک کرده یا نه
 */
export async function GET(request) {
  try {
    const session = await auth();
    const currentUserId = session?.user ? 
      (await prisma.user.findFirst({ where: { phone: session.user.phone }, select: { id: true } }))?.id 
      : null;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get all content with like count and user's like status
    const contents = await prisma.adminContent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        likes: currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true }
        } : false,
        _count: {
          select: { likes: true }
        }
      }
    });

    // Transform data to include isLiked flag
    const transformedContents = contents.map(content => ({
      id: content.id,
      title: content.title,
      description: content.description,
      imageUrl: content.imageUrl,
      linkUrl: content.linkUrl,
      views: content.views,
      createdAt: content.createdAt,
      author: content.author,
      likesCount: content._count.likes,
      isLikedByCurrentUser: currentUserId ? content.likes.length > 0 : false
    }));

    return Response.json({
      success: true,
      data: transformedContents,
      count: transformedContents.length
    });

  } catch (error) {
    console.error("❌ [GET /api/content] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در دریافت محتواها"
    }, { status: 500 });
  }
}


