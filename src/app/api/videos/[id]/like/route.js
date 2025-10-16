import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";
import { checkUserBlocked, handleUserBlockedError } from "@/app/api/utils/checkUserBlocked";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const videoId = params.id;

    if (!videoId) {
      return Response.json({ error: 'شناسه ویدیو الزامی است' }, { status: 400 });
    }

    // بررسی وضعیت کاربر
    let user;
    try {
      user = await checkUserBlocked(session.user.id);
    } catch (error) {
      return handleUserBlockedError(error);
    }

    // بررسی وجود لایک
    const existingLike = await prisma.videoLike.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: videoId,
        },
      },
    });

    let liked = false;

    if (existingLike) {
      // آنلایک: حذف لایک
      await prisma.videoLike.delete({
        where: { id: existingLike.id },
      });
      liked = false;
    } else {
      // لایک: ایجاد رکورد جدید
      await prisma.videoLike.create({
        data: {
          userId: user.id,
          videoId: videoId,
        },
      });
      liked = true;
    }

    // دریافت تعداد کل لایک‌ها
    const likeCount = await prisma.videoLike.count({
      where: { videoId: videoId },
    });

    return Response.json({ 
      success: true, 
      liked,
      likeCount,
    });

  } catch (error) {
    console.error('Error toggling video like:', error);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
