import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    // Get user info from Prisma
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Get all active challenges using Prisma
    const challengesData = await prisma.challenge.findMany({
      where: {
        isActive: true, // فقط چالش‌های فعال
      },
      include: {
        participations: {
          select: {
            studentId: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // Transform to match frontend expectations
    const challenges = challengesData.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      start_date: challenge.startDate,
      end_date: challenge.endDate,
      is_active: challenge.isActive,
      total_participants: challenge.participations.length,
      successful_participants: 0, // این فیلد در مدل فعلی نداریم
    }));

    console.log('✅ Fetched challenges for student:', challenges.length);
    return Response.json({ challenges });
  } catch (error) {
    console.error("Get challenges error:", error);
    return Response.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const {
      title,
      description,
      start_date,
      end_date,
      is_active = true,
    } = await request.json();

    // Get user info from Prisma
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const isAdvisor = currentUser.role === "ADMIN"; // در Prisma، نقش ADMIN داریم نه advisor

    if (!isAdvisor) {
      return Response.json(
        { error: "فقط مشاور می‌تواند چالش ایجاد کند" },
        { status: 403 },
      );
    }

    // Validate required fields
    if (!title || !start_date || !end_date) {
      return Response.json(
        {
          error: "عنوان، تاریخ شروع و پایان الزامی است",
        },
        { status: 400 },
      );
    }

    // Validate dates
    if (new Date(start_date) > new Date(end_date)) {
      return Response.json(
        {
          error: "تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد",
        },
        { status: 400 },
      );
    }

    // Create challenge using Prisma
    const newChallenge = await prisma.challenge.create({
      data: {
        title,
        description: description || "",
        startDate: new Date(start_date),
        endDate: new Date(end_date),
        isActive: is_active,
      },
    });

    console.log('✅ Challenge created:', newChallenge.id);

    return Response.json({
      message: "چالش با موفقیت ایجاد شد",
      challenge: {
        id: newChallenge.id,
        title: newChallenge.title,
        description: newChallenge.description,
        start_date: newChallenge.startDate,
        end_date: newChallenge.endDate,
        is_active: newChallenge.isActive,
      },
    });
  } catch (error) {
    console.error("Create challenge error:", error);
    return Response.json({ error: "خطای سرور در ایجاد چالش" }, { status: 500 });
  }
}
