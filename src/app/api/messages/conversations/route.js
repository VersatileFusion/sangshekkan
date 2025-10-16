import { auth } from "@/auth";
import prisma from "@/app/api/utils/prisma";

/**
 * GET /api/messages/conversations
 * Get all conversation threads for admin (both private and public)
 */
export async function GET(request) {
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

    // Get all students who have sent private messages
    const privateConversations = await prisma.chatMessage.findMany({
      where: {
        type: 'private',
        OR: [
          { senderId: admin.id }, // Messages sent by admin
          { privateToUserId: admin.id } // Messages sent to admin
        ]
      },
      select: {
        senderId: true,
        privateToUserId: true,
        sender: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
            role: true
          }
        },
        privateTo: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
            role: true
          }
        },
        createdAt: true,
        content: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by conversation partner
    const conversationMap = new Map();

    privateConversations.forEach(msg => {
      // Determine the student in this conversation
      const student = msg.senderId === admin.id ? msg.privateTo : msg.sender;
      
      if (!student || student.role !== 'STUDENT') return;

      if (!conversationMap.has(student.id)) {
        conversationMap.set(student.id, {
          studentId: student.id,
          studentName: student.name || 'بدون نام',
          studentAvatar: student.profileImageUrl,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          type: 'private'
        });
      }
    });

    const conversations = Array.from(conversationMap.values());

    // Sort by most recent
    conversations.sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    // Add public chat as a special conversation
    const publicMessages = await prisma.chatMessage.findMany({
      where: {
        type: 'public',
        status: 'visible'
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (publicMessages.length > 0) {
      conversations.unshift({
        studentId: 'public',
        studentName: 'چت عمومی',
        studentAvatar: null,
        lastMessage: publicMessages[0].content,
        lastMessageTime: publicMessages[0].createdAt,
        type: 'public'
      });
    } else {
      conversations.unshift({
        studentId: 'public',
        studentName: 'چت عمومی',
        studentAvatar: null,
        lastMessage: 'هیچ پیامی وجود ندارد',
        lastMessageTime: new Date(),
        type: 'public'
      });
    }

    console.log(`✅ [GET /api/messages/conversations] Fetched ${conversations.length} conversations`);

    return Response.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error("❌ [GET /api/messages/conversations] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در دریافت مکالمات"
    }, { status: 500 });
  }
}

