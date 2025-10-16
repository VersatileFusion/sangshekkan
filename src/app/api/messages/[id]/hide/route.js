import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

/**
 * PATCH /api/messages/[id]/hide - مخفی کردن پیام توسط ادمین
 */
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { id } = params;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Only admins can hide messages
    if (currentUser.role !== "ADMIN") {
      return Response.json({ error: "فقط مدیر می‌تواند پیام‌ها را مخفی کند" }, { status: 403 });
    }

    // Check if message exists
    const message = await prisma.chatMessage.findUnique({
      where: { id }
    });

    if (!message) {
      return Response.json({ error: "پیام یافت نشد" }, { status: 404 });
    }

    // Hide the message
    const updatedMessage = await prisma.chatMessage.update({
      where: { id },
      data: {
        status: "hidden",
        deletedBy: currentUser.id,
        deletedAt: new Date()
      }
    });

    console.log(`✅ [PATCH /api/messages/${id}/hide] Message hidden by admin ${currentUser.id}`);

    return Response.json({
      success: true,
      message: "پیام با موفقیت مخفی شد",
      data: updatedMessage
    });

  } catch (error) {
    console.error(`❌ [PATCH /api/messages/hide] Error:`, error);
    return Response.json({
      success: false,
      error: "خطای سرور در مخفی کردن پیام"
    }, { status: 500 });
  }
}

