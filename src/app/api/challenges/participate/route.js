import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";
import { checkUserBlocked, handleUserBlockedError } from "@/app/api/utils/checkUserBlocked";

export async function POST(request) {
  try {
    const session = await auth();
    
    // 1. بررسی احراز هویت
    if (!session?.user) {
      console.error('❌ No session found');
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const body = await request.json();
    const { challenge_id, participation_date } = body;

    // 2. بررسی وجود challengeId
    if (!challenge_id) {
      console.error('❌ No challenge_id provided');
      return Response.json({ error: "شناسه چالش الزامی است" }, { status: 400 });
    }

    // 3. بررسی وجود کاربر و وضعیت مسدود شدن
    let currentUser;
    try {
      currentUser = await checkUserBlocked(session.user.id);
    } catch (error) {
      return handleUserBlockedError(error);
    }

    console.log('✅ User found and not blocked:', currentUser.id);

    // 4. بررسی وجود و فعال بودن چالش
    const challenge = await prisma.challenge.findUnique({
      where: { id: challenge_id },
    });

    if (!challenge) {
      console.error('❌ Challenge not found:', challenge_id);
      return Response.json(
        { error: "چالش یافت نشد" },
        { status: 404 },
      );
    }

    if (!challenge.isActive) {
      console.error('❌ Challenge not active:', challenge_id);
      return Response.json(
        { error: "این چالش فعال نیست" },
        { status: 403 },
      );
    }

    console.log('✅ Challenge found and active:', challenge.id);

    // 5. تاریخ مشارکت (امروز به صورت پیش‌فرض)
    const targetDate = participation_date 
      ? new Date(participation_date) 
      : new Date();
    
    // تنظیم ساعت به 00:00:00 برای مقایسه تاریخ
    targetDate.setHours(0, 0, 0, 0);

    // 6. بررسی مشارکت قبلی برای همین تاریخ
    const existingParticipation = await prisma.challengeParticipation.findFirst({
      where: {
        studentId: currentUser.id,
        challengeId: challenge_id,
        date: targetDate,
      },
    });

    if (existingParticipation) {
      console.log('⚠️ Already participated on this date');
      return Response.json(
        { 
          error: "شما قبلاً در این چالش برای امروز شرکت کرده‌اید",
          participation: existingParticipation 
        },
        { status: 409 }
      );
    }

    // 7. ایجاد رکورد مشارکت جدید
    const newParticipation = await prisma.challengeParticipation.create({
      data: {
        studentId: currentUser.id,
        challengeId: challenge_id,
        date: targetDate,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
        challenge: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.log('✅ Participation created:', newParticipation.id);

    return Response.json({
      message: "مشارکت شما با موفقیت ثبت شد",
      participation: newParticipation,
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Challenge participation error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return Response.json({ 
      error: "خطای سرور در ثبت مشارکت",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");

    // Get user info from Prisma
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Build where clause based on query params
    const where = {};
    
    if (challengeId) {
      // اگر challengeId مشخص شده، مشارکت‌های آن چالش را برگردان
      where.challengeId = challengeId;
    } else {
      // در غیر این صورت، فقط مشارکت‌های خود کاربر را برگردان
      where.studentId = currentUser.id;
    }

    // Get participations using Prisma
    const participationsData = await prisma.challengeParticipation.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
        challenge: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 50,
    });

    // Transform to match frontend expectations
    const participations = participationsData.map(p => ({
      id: p.id,
      challenge_id: p.challengeId,
      user_id: p.studentId,
      participation_date: p.date,
      challenge_title: p.challenge.title,
      user_name: p.student.name,
      profile_image_url: p.student.profileImageUrl,
      created_at: p.date,
    }));

    console.log('✅ Fetched participations:', participations.length);
    return Response.json({ participations });
  } catch (error) {
    console.error("Get participations error:", error);
    return Response.json({ error: "خطای سرور" }, { status: 500 });
  }
}
