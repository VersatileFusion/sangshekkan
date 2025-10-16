import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const videoId = params.id;
    const userId = session.user.id;

    if (!videoId) {
      return Response.json({ error: 'شناسه ویدیو الزامی است' }, { status: 400 });
    }

    try {
      // ۱. تلاش برای ایجاد یک رکورد بازدید جدید
      // اگر کاربر قبلاً این ویدیو را دیده باشد، این دستور با خطا مواجه می‌شود
      await prisma.videoView.create({
        data: {
          userId: userId,
          videoId: videoId,
        },
      });

      // ۲. اگر ایجاد موفقیت‌آمیز بود، یعنی یک بازدید یکتای جدید است
      // شمارنده اصلی را یک واحد افزایش بده
      const updatedVideo = await prisma.video.update({
        where: { id: videoId },
        data: { views: { increment: 1 } },
        select: {
          id: true,
          views: true,
        },
      });

      return Response.json({ 
        success: true, 
        views: updatedVideo.views,
        message: 'بازدید با موفقیت ثبت شد'
      });

    } catch (error) {
      // ۳. اگر به دلیل محدودیت یکتا (کد P2002) خطا رخ داد، هیچ کاری نکن
      // بازدید قبلاً شمرده شده است. فقط تعداد بازدید فعلی را برگردان
      if (error.code === 'P2002') {
        const video = await prisma.video.findUnique({ 
          where: { id: videoId },
          select: { views: true }
        });
        return Response.json({ 
          success: true,
          views: video?.views || 0, 
          message: 'بازدید قبلاً ثبت شده است.' 
        });
      }
      
      // برای خطاهای دیگر، آن را به catch بیرونی پرتاب کن
      throw error;
    }

  } catch (error) {
    console.error('Error incrementing video views:', error);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

