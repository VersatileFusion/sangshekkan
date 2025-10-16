import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";
import { checkUserBlocked, handleUserBlockedError } from "@/app/api/utils/checkUserBlocked";

/**
 * POST /api/challenges/progress
 * ثبت پیشرفت روزانه دانش‌آموز در یک چالش
 */
export async function POST(request) {
  try {
    const session = await auth();
    
    // 1. بررسی احراز هویت
    if (!session?.user) {
      console.error('❌ [Progress] No session found');
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    // 2. بررسی وضعیت مسدود شدن کاربر
    let currentUser;
    try {
      currentUser = await checkUserBlocked(session.user.id);
    } catch (error) {
      return handleUserBlockedError(error);
    }

    const body = await request.json();
    const { challengeId, challengeParticipationId, satisfactionRating, notes } = body;

    console.log('📥 [Progress] Request:', { challengeId, challengeParticipationId, satisfactionRating });

    // 3. اعتبارسنجی ورودی‌ها
    if (!satisfactionRating || satisfactionRating < 1 || satisfactionRating > 5) {
      return Response.json({ 
        error: "امتیاز رضایت باید بین 1 تا 5 باشد" 
      }, { status: 400 });
    }

    console.log('✅ [Progress] User verified and not blocked:', currentUser.id);

    // 4. یافتن مشارکت کاربر
    let participation;
    
    if (challengeParticipationId) {
      // روش 1: با ID مشارکت مستقیم
      participation = await prisma.challengeParticipation.findFirst({
        where: {
          id: challengeParticipationId,
          studentId: currentUser.id,
        },
        include: {
          challenge: true,
        },
      });
    } else if (challengeId) {
      // روش 2: با شناسه چالش  
      participation = await prisma.challengeParticipation.findUnique({
        where: {
          studentId_challengeId: {
            studentId: currentUser.id,
            challengeId: challengeId,
          },
        },
        include: {
          challenge: true,
        },
      });
    } else {
      return Response.json({ 
        error: "شناسه چالش یا مشارکت الزامی است" 
      }, { status: 400 });
    }

    if (!participation) {
      console.error('❌ [Progress] Participation not found');
      return Response.json({ 
        error: "مشارکت یافت نشد یا دسترسی غیرمجاز" 
      }, { status: 404 });
    }

    console.log('✅ [Progress] Participation found:', participation.id);

    // 5. تنظیم تاریخ (امروز)
    const targetDate = new Date();
    targetDate.setHours(0, 0, 0, 0);

    // 6. بررسی تکراری نبودن
    const existingProgress = await prisma.dailyProgress.findUnique({
      where: {
        participationId_date: {
          participationId: participation.id,
          date: targetDate,
        },
      },
    });

    if (existingProgress) {
      console.log('⚠️ [Progress] Already submitted today');
      return Response.json({ 
        error: "شما قبلاً برای امروز پیشرفت ثبت کرده‌اید",
        progress: existingProgress 
      }, { status: 409 });
    }

    // 7. ایجاد رکورد پیشرفت روزانه
    const newProgress = await prisma.dailyProgress.create({
      data: {
        participationId: participation.id,
        date: targetDate,
        satisfactionRating: parseInt(satisfactionRating),
        notes: notes || null,
        status: "COMPLETED",
      },
    });

    console.log('✅ [Progress] Daily progress created:', newProgress.id);

    // 8. محاسبه و به‌روزرسانی درصد پیشرفت
    const challenge = participation.challenge;
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const completedDays = await prisma.dailyProgress.count({
      where: { participationId: participation.id },
    });

    const progressPercentage = Math.min(Math.round((completedDays / totalDays) * 100), 100);

    // 9. به‌روزرسانی درصد پیشرفت
    const updatedParticipation = await prisma.challengeParticipation.update({
      where: { id: participation.id },
      data: { progress: progressPercentage },
    });

    console.log('✅ [Progress] Progress updated to:', progressPercentage + '%');

    return Response.json({
      message: "پیشرفت امروز شما با موفقیت ثبت شد",
      progress: newProgress,
      progressPercentage,
    }, { status: 201 });

  } catch (error) {
    console.error("❌ [Progress] Error:", error);
    console.error("Error details:", error.message);
    return Response.json({ 
      error: "خطای سرور در ثبت پیشرفت",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

