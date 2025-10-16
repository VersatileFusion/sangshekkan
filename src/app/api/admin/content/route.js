import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

/**
 * POST /api/admin/content - ایجاد محتوای جدید توسط ادمین
 * Body: { title, description, imageUrl, linkUrl }
 */
export async function POST(request) {
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

    // Only admins can create content
    if (currentUser.role !== "ADMIN") {
      return Response.json({ error: "فقط مدیر می‌تواند محتوا ایجاد کند" }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json({ error: "فرمت JSON نامعتبر است" }, { status: 400 });
    }

    const { title, description, imageUrl, linkUrl } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return Response.json({ error: "عنوان الزامی است" }, { status: 400 });
    }

    if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim().length === 0) {
      return Response.json({ error: "تصویر الزامی است" }, { status: 400 });
    }

    // Create new admin content
    const content = await prisma.adminContent.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl?.trim() || null,
        authorId: currentUser.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    console.log(`✅ [POST /api/admin/content] Content created by ${currentUser.id}: ${content.title}`);

    return Response.json({
      success: true,
      message: "محتوا با موفقیت ایجاد شد",
      data: content
    }, { status: 201 });

  } catch (error) {
    console.error("❌ [POST /api/admin/content] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در ایجاد محتوا"
    }, { status: 500 });
  }
}


