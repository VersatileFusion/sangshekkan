import prisma from "@/app/api/utils/prisma";
import { rateLimit } from "@/app/api/utils/rateLimit";
import { sendSMS, normalizeIranPhone } from "@/app/api/utils/sms";

// Disable any static optimization/caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Optional: handle provider health checks that may hit this endpoint with GET/HEAD
export async function GET() {
  return new Response('OK', { status: 200, headers: { 'cache-control': 'no-store' } });
}

export async function POST(request) {
  try {
    const rl = await rateLimit(request, { key: 'otp_verify', windowMs: 60_000, limit: 10 });
    if (rl.error) return rl.error;

    // Robust JSON parsing to avoid crashes on empty/invalid bodies (e.g., platform health checks)
    let body;
    try {
      body = await request.json();
    } catch (error) {
      try {
        const err = error;
        let serialized = null;
        try { serialized = JSON.stringify(err); } catch { serialized = '[unserializable error]'; }
        console.error('🔥🔥🔥 OTP_VERIFY_INVALID_JSON 🔥🔥🔥', {
          message: err?.message,
          stack: err?.stack,
          cause: err?.cause,
          serialized,
          context: { route: '/api/auth/otp/verify' }
        });
      } catch {}
      return Response.json(
        { success: false, error: 'INVALID_JSON', message: 'درخواست نامعتبر است. فرمت باید JSON باشد.' },
        { status: 400 }
      );
    }

    const { phone, code, purpose = 'signup' } = body || {};

    if (!phone || !code) {
      return Response.json({ error: 'شماره موبایل و کد الزامی است' }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = normalizeIranPhone(String(phone || '').trim().replace(/[\s-]/g, ''));
    const legacyPhone09 = normalizedPhone.startsWith('+98')
      ? '0' + normalizedPhone.slice(3)
      : (String(phone) || '');

    // Find OTP record for this phone (regardless of expiration or code match)
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        purpose,
        isUsed: false,
        phone: { in: [normalizedPhone, legacyPhone09] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no OTP record found at all
    if (!otpRecord) {
      return Response.json({ 
        success: false,
        error: 'NO_OTP_FOUND',
        message: 'کد تاییدی برای این شماره یافت نشد. لطفاً ابتدا درخواست کد دهید.' 
      }, { status: 400 });
    }

    // Check for expiration FIRST (priority over code mismatch)
    const now = new Date();
    if (otpRecord.expiresAt <= now) {
      console.warn(`[OTP_VERIFY] Expired code for ${normalizedPhone}`);
      return Response.json({ 
        success: false,
        error: 'EXPIRED_CODE',
        message: 'کد منقضی شده است. لطفاً دوباره درخواست دهید.' 
      }, { status: 400 });
    }

    // Check for code mismatch SECOND
    if (otpRecord.code !== String(code)) {
      // Increment attempts for failed verification
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } }
      });

      console.warn(`[OTP_VERIFY] Invalid code for ${normalizedPhone}. Attempt: ${otpRecord.attempts + 1}`);
      
      return Response.json({ 
        success: false,
        error: 'INVALID_CODE',
        message: 'کد وارد شده نامعتبر است.' 
      }, { status: 400 });
    }

    // Check attempts limit (should be checked after we know code matches)
    if (otpRecord.attempts >= 3) {
      return Response.json({ 
        success: false,
        error: 'TOO_MANY_ATTEMPTS',
        message: 'تعداد تلاش‌ها بیش از حد مجاز. لطفاً کد جدید درخواست دهید' 
      }, { status: 429 });
    }

    // Mark OTP as used
    await prisma.otpCode.update({ 
      where: { id: otpRecord.id }, 
      data: { isUsed: true } 
    });

    // Reset OTP attempts and block status for existing users
    try {
      const user = await prisma.user.findFirst({
        where: { phone: { in: [normalizedPhone, legacyPhone09] } }
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otpAttempts: 0,
            otpBlockedUntil: null,
            otpSentAt: new Date()
          }
        });
      }

      // Also reset tracking record for signup flow
      await prisma.otpCode.updateMany({
        where: {
          phone: { in: [normalizedPhone, legacyPhone09] },
          purpose: 'signup_tracking'
        },
        data: {
          attempts: 0,
          isUsed: true
        }
      });
    } catch (resetError) {
      console.error('Failed to reset OTP tracking:', resetError);
      // Don't fail the verification if reset fails
    }

    // Send notification to advisor for new student registration
    if (purpose === 'signup') {
      try {
        const advisorMessage = `خانم سنگ‌شکن عزیز، یک دانش‌آموز جدید ثبت‌نام کرد:
شماره: ${normalizedPhone}
زمان: ${new Date().toLocaleString('fa-IR')}`;
        // ارسال پیام به شماره مدیریت/مشاور از ENV
        const adminMsisdn = process.env.SIGNUP_ALERT_MSISDN;
        if (adminMsisdn) {
          await sendSMS(adminMsisdn, advisorMessage, { retries: 2 });
        } else {
          console.warn('SIGNUP_ALERT_MSISDN not set; skipping advisor SMS');
        }
      } catch (error) {
        console.error('Failed to send advisor notification:', error);
      }
    }

    return Response.json({ 
      success: true,
      message: 'کد تایید با موفقیت بررسی شد',
      verified: true,
      phone: normalizedPhone
    });

  } catch (error) {
    console.error('OTP verify error:', error);
    return Response.json({ 
      success: false,
      error: 'SERVER_ERROR',
      message: 'خطای سرور در بررسی کد' 
    }, { status: 500 });
  }
}
