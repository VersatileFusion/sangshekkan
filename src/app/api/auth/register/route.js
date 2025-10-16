import prisma from "@/app/api/utils/prisma";
import { rateLimit } from "@/app/api/utils/rateLimit";
import { sendSMS, normalizeIranPhone } from "@/app/api/utils/sms";

export async function POST(request) {
  try {
    const rl = await rateLimit(request, { key: 'register', windowMs: 60_000, limit: 10 });
    if (rl.error) return rl.error;
    
    const { phone } = await request.json();
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    if (!rawPhone) return Response.json({ error: 'شماره موبایل الزامی است' }, { status: 400 });

    const phoneRegex = /^(?:\+98|0098|98|0)?9\d{9}$/;
    if (!phoneRegex.test(rawPhone)) {
      return Response.json({ error: 'فرمت شماره موبایل معتبر نیست' }, { status: 400 });
    }

    const normalizedPhone = normalizeIranPhone(rawPhone);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { phone: normalizedPhone }
    });

    if (existingUser) {
      return Response.json({ 
        error: 'این شماره موبایل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.',
        errorCode: 'USER_EXISTS'
      }, { status: 409 });
    }

    // 2-minute resend window
    const recent = await prisma.otpCode.findFirst({ 
      where: { phone: normalizedPhone, createdAt: { gte: new Date(Date.now() - 120_000) } }, 
      orderBy: { createdAt: 'desc' } 
    });
    
    if (recent) {
      const timeLeft = Math.ceil((recent.createdAt.getTime() + 120_000 - Date.now()) / 1000);
      return Response.json({ error: `لطفاً ${timeLeft} ثانیه دیگر صبر کنید` }, { status: 429 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    await prisma.otpCode.create({ data: { phone: normalizedPhone, code, purpose: 'signup', expiresAt } });

    // Message is now handled by SMS.ir template - no need to construct it here
    // const message = `کد تایید شما: ${code}\nاعتبار: ۲ دقیقه`; // REMOVED - template handles this

    try {
      // Pass only the phone and raw OTP code - template will format the message
      const sent = await sendSMS(normalizedPhone, code, { retries: 2 });
      
      if (!sent) {
        throw new Error('SMS provider returned no success');
      }
    } catch (e) {
      console.error('[Register] sendSMS failed:', e);
      await prisma.otpCode.deleteMany({ where: { phone: normalizedPhone, code, purpose: 'signup' } });
      return Response.json({ error: 'ارسال پیامک ناموفق بود' }, { status: 500 });
    }

    return Response.json({ 
      message: 'کد تایید ارسال شد', 
      phone: normalizedPhone, 
      expiresIn: 120,
      ...(process.env.TEST_ECHO_OTP === 'true' ? { debugCode: code } : {})
    });
  } catch (error) {
    console.error('Register(OTP) error:', error);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
