import { auth } from "@/auth";
import prisma from "@/app/api/utils/prisma";

/**
 * DELETE /api/messages/public/:messageId
 * Delete a public chat message (Admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد حساب کاربری خود شوید" }, { status: 401 });
    }

    // Get current user and verify admin role
    const admin = await prisma.user.findUnique({
      where: { phone: session.user.phone },
      select: { id: true, role: true }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return Response.json({ error: "فقط مدیران می‌توانند پیام‌ها را حذف کنند" }, { status: 403 });
    }

    const { messageId } = params;

    if (!messageId) {
      return Response.json({ error: "شناسه پیام الزامی است" }, { status: 400 });
    }

    // Find the message and verify it's a public message
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { 
        id: true, 
        type: true, 
        status: true,
        senderId: true,
        content: true
      }
    });

    if (!message) {
      return Response.json({ error: "پیام یافت نشد" }, { status: 404 });
    }

    if (message.type !== 'public') {
      return Response.json({ error: "فقط پیام‌های عمومی قابل حذف هستند" }, { status: 400 });
    }

    // Option 1: Soft delete (mark as hidden)
    // This preserves the message in database but hides it from users
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        status: 'hidden',
        deletedBy: admin.id,
        deletedAt: new Date()
      }
    });

    console.log(`✅ [DELETE /api/messages/public/${messageId}] Admin ${admin.id} deleted message`);

    return Response.json({
      success: true,
      message: "پیام با موفقیت حذف شد",
      deletedMessage: updatedMessage
    });

    // Option 2: Hard delete (permanently remove from database)
    // Uncomment this if you prefer permanent deletion:
    /*
    await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    console.log(`✅ [DELETE /api/messages/public/${messageId}] Admin ${admin.id} permanently deleted message`);

    return Response.json({
      success: true,
      message: "پیام به طور کامل حذف شد"
    });
    */

  } catch (error) {
    console.error("❌ [DELETE /api/messages/public/:messageId] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در حذف پیام"
    }, { status: 500 });
  }
}

