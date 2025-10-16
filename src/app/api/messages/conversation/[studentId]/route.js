import { auth } from "@/auth";
import prisma from "@/app/api/utils/prisma";

/**
 * GET /api/messages/conversation/:studentId
 * Get all messages in a private conversation between admin and a student
 * OR get public messages if studentId is 'public'
 */
export async function GET(request, { params }) {
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
      return Response.json({ error: "فقط مدیران می‌توانند مکالمات را مشاهده کنند" }, { status: 403 });
    }

    const { studentId } = params;

    if (!studentId) {
      return Response.json({ error: "شناسه دانش‌آموز الزامی است" }, { status: 400 });
    }

    // Handle public chat
    if (studentId === 'public') {
      const publicMessages = await prisma.chatMessage.findMany({
        where: {
          type: 'public',
          status: 'visible'
        },
        orderBy: { createdAt: 'asc' },
        take: 100, // Last 100 messages
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

      return Response.json({
        success: true,
        messages: publicMessages,
        type: 'public'
      });
    }

    // Handle private conversation
    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, name: true }
    });

    if (!student) {
      return Response.json({ error: "دانش‌آموز یافت نشد" }, { status: 404 });
    }

    if (student.role !== 'STUDENT') {
      return Response.json({ error: "فقط می‌توان با دانش‌آموزان مکالمه کرد" }, { status: 400 });
    }

    // Get all private messages between admin and this student
    const privateMessages = await prisma.chatMessage.findMany({
      where: {
        type: 'private',
        OR: [
          {
            senderId: admin.id,
            privateToUserId: studentId
          },
          {
            senderId: studentId,
            privateToUserId: admin.id
          }
        ]
      },
      orderBy: { createdAt: 'asc' },
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
            name: true,
            role: true
          }
        }
      }
    });

    console.log(`✅ [GET /api/messages/conversation/${studentId}] Fetched ${privateMessages.length} messages`);

    return Response.json({
      success: true,
      messages: privateMessages,
      type: 'private',
      student: {
        id: student.id,
        name: student.name
      }
    });

  } catch (error) {
    console.error("❌ [GET /api/messages/conversation/:studentId] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در دریافت پیام‌ها"
    }, { status: 500 });
  }
}

