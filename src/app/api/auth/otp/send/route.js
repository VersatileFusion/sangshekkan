import prisma from "@/app/api/utils/prisma";
import { rateLimit } from "@/app/api/utils/rateLimit";
import { sendSMS, normalizeIranPhone } from "@/app/api/utils/sms";

export async function POST(request) {
  console.log('🚀 [OTP SEND] Route called - POST /api/auth/otp/send');
  console.log('📱 [OTP SEND] Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    console.log('⏱️ [OTP SEND] Starting rate limit check...');
    // Keep IP-based rate limit
    const rl = await rateLimit(request, { key: 'register', windowMs: 60_000, limit: 10 });
    if (rl.error) {
      console.log('❌ [OTP SEND] Rate limit exceeded:', rl.error);
      return rl.error;
    }
    console.log('✅ [OTP SEND] Rate limit check passed');

    console.log('📝 [OTP SEND] Parsing request body...');
    const { phone } = await request.json();
    console.log('📱 [OTP SEND] Raw phone from request:', phone);
    
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    console.log('🔧 [OTP SEND] Processed phone:', rawPhone);
    
    if (!rawPhone) {
      console.log('❌ [OTP SEND] No phone provided');
      return Response.json({ error: 'شماره موبایل الزامی است' }, { status: 400 });
    }

    console.log('🔍 [OTP SEND] Validating phone format...');
    const phoneRegex = /^(?:\+98|0098|98|0)?9\d{9}$/;
    const isValidFormat = phoneRegex.test(rawPhone);
    console.log('📱 [OTP SEND] Phone format valid:', isValidFormat, 'for phone:', rawPhone);
    
    if (!isValidFormat) {
      console.log('❌ [OTP SEND] Invalid phone format');
      return Response.json({ error: 'فرمت شماره موبایل معتبر نیست' }, { status: 400 });
    }

    console.log('🔄 [OTP SEND] Normalizing phone number...');
    const normalizedPhone = normalizeIranPhone(rawPhone);
    console.log('📱 [OTP SEND] Normalized phone:', normalizedPhone);

    // Check if user already exists
    console.log('🔍 [OTP SEND] Checking if user already exists...');
    try {
      const existingUser = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
      console.log('👤 [OTP SEND] Existing user check result:', existingUser ? 'User exists' : 'User not found');
      if (existingUser) {
        console.log('❌ [OTP SEND] User already exists, returning error');
        return Response.json({ 
          error: 'این شماره موبایل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.', 
          errorCode: 'USER_EXISTS' 
        }, { status: 409 });
      }
    } catch (dbError) {
      console.warn('⚠️ [OTP SEND] Database check failed, continuing with mock mode:', dbError.message);
      // Continue without database check in mock mode
    }

    // Check for recent OTP requests
    console.log('⏰ [OTP SEND] Checking for recent OTP requests...');
    let recent = null;
    try {
      recent = await prisma.otpCode.findFirst({
        where: { phone: normalizedPhone, createdAt: { gte: new Date(Date.now() - 120_000) } },
        orderBy: { createdAt: 'desc' }
      });
      console.log('📅 [OTP SEND] Recent OTP check result:', recent ? 'Found recent request' : 'No recent requests');
    } catch (dbError) {
      console.warn('⚠️ [OTP SEND] Database resend check failed, continuing:', dbError.message);
    }
    
    if (recent) {
      const timeLeft = Math.ceil((recent.createdAt.getTime() + 120_000 - Date.now()) / 1000);
      console.log('⏳ [OTP SEND] Rate limit active, time left:', timeLeft, 'seconds');
      return Response.json({ error: `لطفاً ${timeLeft} ثانیه دیگر صبر کنید` }, { status: 429 });
    }

    console.log('🎲 [OTP SEND] Generating OTP code...');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    console.log('🔢 [OTP SEND] Generated OTP code:', code, 'expires at:', expiresAt.toISOString());
    
    // Try to store OTP code, but continue if database fails
    console.log('💾 [OTP SEND] Storing OTP code in database...');
    try {
      await prisma.otpCode.create({ data: { phone: normalizedPhone, code, purpose: 'signup', expiresAt } });
      console.log('✅ [OTP SEND] OTP code stored successfully');
    } catch (dbError) {
      console.warn('⚠️ [OTP SEND] Database storage failed, continuing with mock mode:', dbError.message);
    }

    // Message is now handled by SMS.ir template - no need to construct it here
    // const message = `کد تایید شما: ${otpCode}\nاعتبار: ۲ دقیقه\nسامانه مطالعه - خانم سنگ‌شکن`; // REMOVED

    console.log('📱 [OTP SEND] Attempting to send SMS...');
    console.log('🔍 [OTP SEND] Environment check:');
    console.log('  SMS_DRIVER:', process.env.SMS_DRIVER);
    console.log('  SMS_API_KEY:', process.env.SMS_API_KEY ? 'SET' : 'NOT SET');
    console.log('  SMS_SENDER:', process.env.SMS_SENDER);
    console.log('  SMS_TEMPLATE_NAME:', process.env.SMS_TEMPLATE_NAME);
    
    try {
      console.log('📤 [OTP SEND] Calling sendSMS with:', { phone: normalizedPhone, code, retries: 2 });
      // Pass only the phone and raw OTP code - template will format the message
      const sent = await sendSMS(normalizedPhone, code, { retries: 2 });
      console.log('📱 [OTP SEND] SMS send result:', sent);
      
      if (!sent) {
        console.log('❌ [OTP SEND] SMS provider returned no success');
        throw new Error('SMS provider returned no success');
      }
      console.log('✅ [OTP SEND] SMS sent successfully');
    } catch (e) {
      console.error('❌ [OTP SEND] sendSMS failed:', e);
      console.error('❌ [OTP SEND] Error details:', e.message);
      console.error('❌ [OTP SEND] Error stack:', e.stack);
      // Try to cleanup database, but don't fail if database is unavailable
      console.log('🧹 [OTP SEND] Attempting database cleanup...');
      try {
        await prisma.otpCode.deleteMany({ where: { phone: normalizedPhone, code, purpose: 'signup' } });
        console.log('✅ [OTP SEND] Database cleanup successful');
      } catch (dbError) {
        console.warn('⚠️ [OTP SEND] Database cleanup failed:', dbError.message);
      }
      return Response.json({ error: 'ارسال پیامک ناموفق بود' }, { status: 500 });
    }

    console.log('🎉 [OTP SEND] Success! Preparing response...');
    const response = {
      message: 'کد تایید ارسال شد',
      phone: normalizedPhone,
      expiresIn: 120,
      debugCode: code // Always include debug code for testing
    };
    console.log('📤 [OTP SEND] Final response:', response);
    return Response.json(response);
  } catch (error) {
    console.error('💥 [OTP SEND] Unexpected error:', error);
    console.error('💥 [OTP SEND] Error stack:', error.stack);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
