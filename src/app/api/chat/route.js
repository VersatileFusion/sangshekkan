import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

/**
 * GET /api/chat - Backward compatible endpoint (redirects to new /api/messages)
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get("type") || "general";

    // Get current user using Prisma
    const currentUser = await prisma.user.findFirst({
      where: { phone: session.user.phone },
      select: {
        id: true,
        name: true,
        role: true,
        profileImageUrl: true
      }
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Map old chat types to new system
    let type = "public";
    let includePrivate = false;

    if (chatType === "family") {
      type = "private";
      includePrivate = true;
    }

    // Get messages using Prisma
    const where = {};
    
    if (includePrivate) {
      // Private messages: to/from current user
      where.OR = [
        { type: "private", senderId: currentUser.id },
        { type: "private", privateToUserId: currentUser.id }
      ];
    } else {
      // Public messages
      where.type = "public";
      where.status = "visible";
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
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

    // Transform to old format for backward compatibility
    const transformedMessages = messages.map(msg => ({
      id: msg.id,
      message: msg.content,
      chat_type: chatType,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      sender_image: msg.senderAvatarUrl,
      receiver_id: msg.privateToUserId,
      created_at: msg.createdAt,
      is_question: false
    }));

    return Response.json({
      messages: transformedMessages.reverse()
    });

  } catch (error) {
    console.error("❌ [GET /api/chat] Error:", error);
    console.error("Stack:", error.stack);
    return Response.json({
      error: "خطای سرور در دریافت پیام‌ها",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * POST /api/chat - Backward compatible endpoint
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

    const {
      message,
      receiver_id,
      chat_type = "general",
      attachmentUrl,
      isQuestion,
    } = body;

    // Validation
    if (!message || message.trim().length === 0) {
      return Response.json({ error: "پیام نمی‌تواند خالی باشد" }, { status: 400 });
    }

    if (message.trim().length > 1000) {
      return Response.json({ error: "پیام بیش از حد طولانی است" }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findFirst({
      where: { phone: session.user.phone },
      select: {
        id: true,
        name: true,
        role: true,
        profileImageUrl: true
      }
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Determine message type and recipient
    let type = chat_type === "family" ? "private" : "public";
    let targetReceiverId = receiver_id;

    // If it's a question or family chat, send to admin
    if (isQuestion || chat_type === "family") {
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true }
      });

      if (!admin) {
        return Response.json({ error: "مدیر یافت نشد" }, { status: 404 });
      }

      targetReceiverId = admin.id;
      type = "private";
    }

    // Create message using new ChatMessage model
    const newMessage = await prisma.chatMessage.create({
      data: {
        content: message.trim(),
        type,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        senderAvatarUrl: currentUser.profileImageUrl,
        privateToUserId: targetReceiverId || null,
        status: "visible"
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

    console.log(`✅ [POST /api/chat] Message sent by ${currentUser.name}`);

    // Return in old format for backward compatibility
    return Response.json({
      message: "پیام با موفقیت ارسال شد",
      chat_message: {
        id: newMessage.id,
        message: newMessage.content,
        sender_id: newMessage.senderId,
        receiver_id: newMessage.privateToUserId,
        chat_type,
        created_at: newMessage.createdAt
      }
    });

  } catch (error) {
    console.error("❌ [POST /api/chat] Error:", error);
    console.error("Stack:", error.stack);
    return Response.json({
      error: "خطای سرور در ارسال پیام",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}
