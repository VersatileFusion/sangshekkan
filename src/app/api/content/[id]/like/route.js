import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

/**
 * POST /api/content/[id]/like - لایک یا آنلایک کردن محتوا
 */
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return Response.json({ error: "ID محتوا الزامی است" }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findFirst({
      where: { phone: session.user.phone },
      select: { id: true }
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Check if content exists
    const content = await prisma.adminContent.findUnique({
      where: { id }
    });

    if (!content) {
      return Response.json({ error: "محتوا یافت نشد" }, { status: 404 });
    }

    // Check if user already liked this content
    const existingLike = await prisma.contentLike.findUnique({
      where: {
        contentId_userId: {
          contentId: id,
          userId: currentUser.id
        }
      }
    });

    let isLiked = false;

    if (existingLike) {
      // Unlike: delete the like
      await prisma.contentLike.delete({
        where: { id: existingLike.id }
      });
      console.log(`👎 [POST /api/content/${id}/like] User ${currentUser.id} unliked content`);
    } else {
      // Like: create new like
      await prisma.contentLike.create({
        data: {
          contentId: id,
          userId: currentUser.id
        }
      });
      isLiked = true;
      console.log(`👍 [POST /api/content/${id}/like] User ${currentUser.id} liked content`);
    }

    // Get updated like count
    const likesCount = await prisma.contentLike.count({
      where: { contentId: id }
    });

    return Response.json({
      success: true,
      isLiked,
      likesCount
    });

  } catch (error) {
    console.error(`❌ [POST /api/content/like] Error:`, error);
    return Response.json({
      success: false,
      error: "خطای سرور در لایک کردن"
    }, { status: 500 });
  }
}


