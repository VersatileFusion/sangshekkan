import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

/**
 * GET /api/profanities - دریافت لیست کلمات نامناسب (فقط ادمین)
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findFirst({
      where: { phone: session.user.phone },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Only admins can view profanity list
    if (currentUser.role !== "ADMIN") {
      return Response.json({ error: "فقط مدیر می‌تواند لیست کلمات را مشاهده کند" }, { status: 403 });
    }

    const profanities = await prisma.profanity.findMany({
      orderBy: { createdAt: "desc" }
    });

    return Response.json({
      success: true,
      data: profanities,
      count: profanities.length
    });

  } catch (error) {
    console.error("❌ [GET /api/profanities] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در دریافت لیست"
    }, { status: 500 });
  }
}

/**
 * POST /api/profanities - اضافه کردن کلمه جدید (فقط ادمین)
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json({ error: "فرمت JSON نامعتبر است" }, { status: 400 });
    }

    const { word } = body;

    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return Response.json({ error: "کلمه نمی‌تواند خالی باشد" }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findFirst({
      where: { phone: session.user.phone },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Only admins can add words
    if (currentUser.role !== "ADMIN") {
      return Response.json({ error: "فقط مدیر می‌تواند کلمه اضافه کند" }, { status: 403 });
    }

    // Normalize word (remove extra spaces, convert similar letters)
    const normalizedWord = word.trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

    // Check if word already exists
    const existing = await prisma.profanity.findUnique({
      where: { word: normalizedWord }
    });

    if (existing) {
      return Response.json({
        success: false,
        error: "این کلمه قبلاً اضافه شده است"
      }, { status: 409 });
    }

    // Create new profanity word
    const profanity = await prisma.profanity.create({
      data: { word: normalizedWord }
    });

    console.log(`✅ [POST /api/profanities] Word added by admin: ${normalizedWord}`);

    return Response.json({
      success: true,
      message: "کلمه با موفقیت اضافه شد",
      data: profanity
    }, { status: 201 });

  } catch (error) {
    console.error("❌ [POST /api/profanities] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در افزودن کلمه"
    }, { status: 500 });
  }
}

