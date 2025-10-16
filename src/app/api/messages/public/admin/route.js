import { auth } from "@/auth";
import prisma from "@/app/api/utils/prisma";

/**
 * POST /api/messages/public/admin
 * Send a public message from admin (Admin only)
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
      return Response.json({ error: "فقط مدیران می‌توانند در چت عمومی پیام ارسال کنند" }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    // Validation
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return Response.json({ error: "محتوای پیام نمی‌تواند خالی باشد" }, { status: 400 });
    }

    if (content.length > 5000) {
      return Response.json({ error: "طول پیام نباید بیشتر از ۵۰۰۰ کاراکتر باشد" }, { status: 400 });
    }

    // Create public message from admin
    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        type: 'public',
        senderId: admin.id,
        senderName: admin.name,
        senderRole: 'ADMIN',
        senderAvatarUrl: admin.profileImageUrl,
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
        }
      }
    });

    console.log(`✅ [POST /api/messages/public/admin] Admin ${admin.id} sent public message`);

    return Response.json({
      success: true,
      message
    });

  } catch (error) {
    console.error("❌ [POST /api/messages/public/admin] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در ارسال پیام"
    }, { status: 500 });
  }
}


