import prisma from "@/app/api/utils/prisma";
import { rateLimit } from "@/app/api/utils/rateLimit";
import { sendSMS, normalizeIranPhone } from "@/app/api/utils/sms";
import { encode as encodeJwt } from "@auth/core/jwt";

/**
 * OTP Login - Send OTP for existing users
 */
export async function POST(request) {
  try {
    const rl = await rateLimit(request, { key: 'otp_login', windowMs: 60_000, limit: 10 });
    if (rl.error) return rl.error;

    const { phone } = await request.json();
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    if (!rawPhone) return Response.json({ error: 'شماره موبایل الزامی است' }, { status: 400 });

    const phoneRegex = /^(?:\+98|0098|98|0)?9\d{9}$/;
    if (!phoneRegex.test(rawPhone)) {
      return Response.json({ error: 'فرمت شماره موبایل معتبر نیست' }, { status: 400 });
    }

    const normalizedPhone = normalizeIranPhone(rawPhone);

    // Check if user exists
    const existingUser = await prisma.user.findFirst({ 
      where: { phone: normalizedPhone },
      select: { id: true, name: true, phone: true, role: true, status: true }
    });
    
    if (!existingUser) {
      return Response.json({ 
        error: 'این شماره موبایل ثبت‌نام نکرده است. لطفاً ابتدا ثبت‌نام کنید.', 
        errorCode: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if user is suspended
    if (existingUser.status === 'SUSPENDED') {
      return Response.json({ 
        error: 'حساب کاربری شما مسدود شده است. لطفاً با پشتیبانی تماس بگیرید.' 
      }, { status: 403 });
    }

    // 2-minute resend window
    const recent = await prisma.otpCode.findFirst({
      where: { 
        phone: normalizedPhone, 
        purpose: 'login',
        createdAt: { gte: new Date(Date.now() - 120_000) } 
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (recent) {
      const timeLeft = Math.ceil((recent.createdAt.getTime() + 120_000 - Date.now()) / 1000);
      return Response.json({ error: `لطفاً ${timeLeft} ثانیه دیگر صبر کنید` }, { status: 429 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    
    await prisma.otpCode.create({ 
      data: { 
        phone: normalizedPhone, 
        code, 
        purpose: 'login', 
        expiresAt 
      } 
    });

    try {
      const sent = await sendSMS(normalizedPhone, code, { retries: 2 });
      
      if (!sent) {
        throw new Error('SMS provider returned no success');
      }
    } catch (e) {
      console.error('[OTP Login Send] sendSMS failed:', e);
      await prisma.otpCode.deleteMany({ 
        where: { phone: normalizedPhone, code, purpose: 'login' } 
      });
      return Response.json({ error: 'ارسال پیامک ناموفق بود' }, { status: 500 });
    }

    return Response.json({
      message: 'کد تایید برای ورود ارسال شد',
      phone: normalizedPhone,
      expiresIn: 120,
      ...(process.env.TEST_ECHO_OTP === 'true' ? { debugCode: code } : {})
    });
  } catch (error) {
    console.error('OTP Login Send error:', error);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
