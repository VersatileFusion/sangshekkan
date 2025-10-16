import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

/**
 * DELETE /api/profanities/[id] - حذف کلمه نامناسب (فقط ادمین)
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return Response.json({ error: "ID الزامی است" }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findFirst({
      where: { phone: session.user.phone },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Only admins can delete words
    if (currentUser.role !== "ADMIN") {
      return Response.json({ error: "فقط مدیر می‌تواند کلمه را حذف کند" }, { status: 403 });
    }

    // Check if word exists
    const profanity = await prisma.profanity.findUnique({
      where: { id }
    });

    if (!profanity) {
      return Response.json({ error: "کلمه یافت نشد" }, { status: 404 });
    }

    // Delete the word
    await prisma.profanity.delete({
      where: { id }
    });

    console.log(`✅ [DELETE /api/profanities/${id}] Word deleted by admin: ${profanity.word}`);

    return Response.json({
      success: true,
      message: "کلمه با موفقیت حذف شد"
    });

  } catch (error) {
    console.error(`❌ [DELETE /api/profanities] Error:`, error);
    return Response.json({
      success: false,
      error: "خطای سرور در حذف کلمه"
    }, { status: 500 });
  }
}

