import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";
import { checkProfanity } from "@/server/utils/profanityFilter";
import { rateLimit } from "@/app/api/utils/rateLimit";

/**
 * GET /api/messages - دریافت لیست پیام‌های چت
 * Query params: type=public|private, limit=50, includeHidden=true (admin only)
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "public";
    const limit = parseInt(searchParams.get("limit") || "50");
    const includeHidden = searchParams.get("includeHidden") === "true";

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const isAdmin = currentUser.role === "ADMIN";

    // Build query
    const where = { type };

    // If not admin or not requesting hidden messages, only show visible ones
    if (!isAdmin || !includeHidden) {
      where.status = "visible";
    }

    // For private messages, show only messages to/from current user
    if (type === "private") {
      where.OR = [
        { senderId: currentUser.id },
        { privateToUserId: currentUser.id }
      ];
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
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
      messages: messages.reverse(), // Oldest first for chat display
      count: messages.length
    });

  } catch (error) {
    console.error("❌ [GET /api/messages] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در دریافت پیام‌ها"
    }, { status: 500 });
  }
}

/**
 * POST /api/messages - ارسال پیام جدید
 * Body: { content, type: "public"|"private", privateToUserId? }
 */
export async function POST(request) {
  try {
    // Rate limiting: max 5 messages per minute
    const rl = await rateLimit(request, {
      key: 'send_message',
      windowMs: 60_000, // 1 minute
      limit: 5
    });
    
    if (rl.error) return rl.error;

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

    const { content, type = "public", privateToUserId } = body;

    // Validation
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return Response.json({ error: "محتوای پیام نمی‌تواند خالی باشد" }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return Response.json({ error: "پیام نباید بیشتر از ۲۰۰۰ کاراکتر باشد" }, { status: 400 });
    }

    if (!["public", "private"].includes(type)) {
      return Response.json({ error: "نوع پیام نامعتبر است" }, { status: 400 });
    }

    if (type === "private" && !privateToUserId) {
      return Response.json({ error: "برای پیام خصوصی باید گیرنده مشخص شود" }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
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

    // If private message, validate recipient
    if (type === "private") {
      const recipient = await prisma.user.findUnique({
        where: { id: privateToUserId },
        select: { id: true, role: true }
      });

      if (!recipient) {
        return Response.json({ error: "گیرنده پیام یافت نشد" }, { status: 404 });
      }

      // Only allow private messages to/from admins
      if (recipient.role !== "ADMIN" && currentUser.role !== "ADMIN") {
        return Response.json({ error: "پیام خصوصی فقط با مدیر امکان‌پذیر است" }, { status: 403 });
      }
    }

    // Check for profanity
    const profanityCheck = await checkProfanity(content.trim());
    
    if (profanityCheck.hasProfanity) {
      console.warn(`🚫 [POST /api/messages] Profanity detected from ${currentUser.name}: [${profanityCheck.matchedWords.join(', ')}]`);
      
      return Response.json({
        success: false,
        error: "contains_profanity",
        message: "پیام شامل کلمات نامناسب است و ارسال نشد.",
        matchedWords: profanityCheck.matchedWords
      }, { status: 400 });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        type,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        senderAvatarUrl: currentUser.profileImageUrl,
        privateToUserId: type === "private" ? privateToUserId : null,
        containsProfanity: false, // Already checked above
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

    console.log(`✅ [POST /api/messages] Message created by ${currentUser.name} (type: ${type})`);

    return Response.json({
      success: true,
      message: "پیام با موفقیت ارسال شد",
      data: message
    }, { status: 201 });

  } catch (error) {
    console.error("❌ [POST /api/messages] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در ارسال پیام"
    }, { status: 500 });
  }
}

