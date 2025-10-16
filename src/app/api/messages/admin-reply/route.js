import { auth } from "@/auth";
import prisma from "@/app/api/utils/prisma";

/**
 * POST /api/messages/admin-reply
 * Send a private message from admin to a student
 */
export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد حساب کاربری خود شوید" }, { status: 401 });
    }

    // Get current user and verify admin role
    const admin = await prisma.user.findUnique({
      where: { phone: session.user.phone },
      select: { 
        id: true, 
        role: true, 
        name: true,
        profileImageUrl: true
      }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return Response.json({ error: "فقط مدیران می‌توانند پاسخ ارسال کنند" }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, messageContent } = body;

    // Validation
    if (!studentId || !messageContent) {
      return Response.json({ error: "شناسه دانش‌آموز و محتوای پیام الزامی است" }, { status: 400 });
    }

    if (typeof messageContent !== 'string' || messageContent.trim().length === 0) {
      return Response.json({ error: "محتوای پیام نمی‌تواند خالی باشد" }, { status: 400 });
    }

    if (messageContent.length > 5000) {
      return Response.json({ error: "طول پیام نباید بیشتر از ۵۰۰۰ کاراکتر باشد" }, { status: 400 });
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, name: true }
    });

    if (!student) {
      return Response.json({ error: "دانش‌آموز یافت نشد" }, { status: 404 });
    }

    if (student.role !== 'STUDENT') {
      return Response.json({ error: "فقط می‌توان به دانش‌آموزان پیام ارسال کرد" }, { status: 400 });
    }

    // Create private message from admin to student
    const message = await prisma.chatMessage.create({
      data: {
        content: messageContent.trim(),
        type: 'private',
        senderId: admin.id,
        senderName: admin.name,
        senderRole: 'ADMIN',
        senderAvatarUrl: admin.profileImageUrl,
        privateToUserId: studentId,
        status: 'visible'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            profileImageUrl: true
          }
        },
        privateTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ [POST /api/messages/admin-reply] Admin ${admin.id} sent message to student ${studentId}`);

    return Response.json({
      success: true,
      message
    });

  } catch (error) {
    console.error("❌ [POST /api/messages/admin-reply] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در ارسال پیام"
    }, { status: 500 });
  }
}

