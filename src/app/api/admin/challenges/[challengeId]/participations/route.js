import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

/**
 * GET /api/admin/challenges/[challengeId]/participations
 * دریافت لیست شرکت‌کنندگان یک چالش با جزئیات پیشرفت
 * فقط برای ادمین
 */
export async function GET(request, { params }) {
  try {
    console.log('🔍 [Admin Participations] Starting request...');
    const session = await auth();
    
    // 1. بررسی احراز هویت
    if (!session?.user) {
      console.error('❌ [Admin Participations] No session');
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    console.log('✅ [Admin Participations] User authenticated:', session.user.id);

    // 2. بررسی نقش ادمین
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      console.error('❌ [Admin Participations] User is not admin:', currentUser?.role);
      return Response.json({ 
        error: "شما دسترسی لازم برای این عملیات را ندارید" 
      }, { status: 403 });
    }

    console.log('✅ [Admin Participations] Admin verified');

    const { challengeId } = params;
    console.log('🎯 [Admin Participations] Challenge ID:', challengeId);

    // 3. بررسی وجود چالش
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      console.error('❌ [Admin Participations] Challenge not found');
      return Response.json({ error: "چالش یافت نشد" }, { status: 404 });
    }

    console.log('✅ [Admin Participations] Challenge found:', challenge.title);

    // 4. دریافت تمام شرکت‌کنندگان با جزئیات پیشرفت
    const participations = await prisma.challengeParticipation.findMany({
      where: { challengeId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            phone: true,
            profileImageUrl: true,
            grade: true,
            field: true,
          },
        },
        dailyProgress: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: {
        progress: 'desc',
      },
    });

    console.log(`✅ [Admin Participations] Found ${participations.length} participations`);

    // 5. محاسبه آمار برای هر شرکت‌کننده
    const participantsData = participations.map(p => {
      const totalDays = p.dailyProgress.length;
      const avgRating = totalDays > 0
        ? p.dailyProgress.reduce((sum, d) => sum + d.satisfactionRating, 0) / totalDays
        : 0;

      return {
        id: p.id,
        studentId: p.student.id,
        studentName: p.student.name,
        studentPhone: p.student.phone,
        studentProfileImage: p.student.profileImageUrl,
        studentGrade: p.student.grade,
        studentField: p.student.field,
        progress: p.progress,
        totalDays,
        averageRating: Math.round(avgRating * 10) / 10,
        joinedAt: p.createdAt,
        lastActivity: totalDays > 0 ? p.dailyProgress[0].date : null,
        dailyProgress: p.dailyProgress,
      };
    });

    // 6. محاسبه آمار کلی چالش
    const totalParticipants = participantsData.length;
    const avgChallengeRating = totalParticipants > 0
      ? participantsData.reduce((sum, p) => sum + p.averageRating, 0) / totalParticipants
      : 0;
    const avgProgress = totalParticipants > 0
      ? participantsData.reduce((sum, p) => sum + p.progress, 0) / totalParticipants
      : 0;

    // 7. محاسبه تعداد روزهای چالش
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const totalChallengeDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    console.log('✅ [Admin Participations] Returning data');

    return Response.json({
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        totalDays: totalChallengeDays,
        isActive: challenge.isActive,
      },
      statistics: {
        totalParticipants,
        averageRating: Math.round(avgChallengeRating * 10) / 10,
        averageProgress: Math.round(avgProgress),
      },
      participants: participantsData,
    });

  } catch (error) {
    console.error("❌ [Admin Participations] Error:", error);
    console.error("Error details:", error.message);
    return Response.json({ 
      error: "خطای سرور",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

