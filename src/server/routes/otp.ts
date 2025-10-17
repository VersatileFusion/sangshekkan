import { Hono } from 'hono';
import prisma from '../../app/api/utils/prisma';
import { rateLimit } from '../../app/api/utils/rateLimit';
import { sendSMS, normalizeIranPhone } from '../../app/api/utils/sms';
import { hash as argonHash } from 'argon2';
import { encode as encodeJwt } from '@auth/core/jwt';

const otpRouter = new Hono();

// OTP Login - Send OTP for existing users
otpRouter.post('/auth/otp/login', async (c) => {
  console.log('🚀 [OTP LOGIN] Route called - POST /api/auth/otp/login');
  
  try {
    const rl = await rateLimit(c.req.raw, { key: 'otp_login', windowMs: 60_000, limit: 10 });
    if (rl.error) {
      console.log('❌ [OTP LOGIN] Rate limit exceeded:', rl.error);
      return c.json(rl.error.body, rl.error.status as any);
    }

    const { phone } = await c.req.json();
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    
    console.log('📱 [OTP LOGIN] Raw phone from request:', rawPhone);
    
    if (!rawPhone) {
      console.log('❌ [OTP LOGIN] No phone provided');
      return c.json({ error: 'شماره موبایل الزامی است' }, 400 as any);
    }

    const phoneRegex = /^(?:\+98|0098|98|0)?9\d{9}$/;
    if (!phoneRegex.test(rawPhone)) {
      console.log('❌ [OTP LOGIN] Invalid phone format');
      return c.json({ error: 'فرمت شماره موبایل معتبر نیست' }, 400 as any);
    }

    const normalizedPhone = normalizeIranPhone(rawPhone);
    console.log('📱 [OTP LOGIN] Normalized phone:', normalizedPhone);

    // Check if user exists
    const existingUser = await prisma.user.findFirst({ 
      where: { phone: normalizedPhone },
      select: { id: true, name: true, phone: true, role: true, status: true }
    });
    
    if (!existingUser) {
      console.log('❌ [OTP LOGIN] User not found for phone:', normalizedPhone);
      return c.json({ 
        error: 'این شماره موبایل ثبت‌نام نکرده است. لطفاً ابتدا ثبت‌نام کنید.', 
        errorCode: 'USER_NOT_FOUND' 
      }, 404 as any);
    }

    // Check if user is suspended
    if (existingUser.status === 'SUSPENDED') {
      console.log('❌ [OTP LOGIN] User suspended:', existingUser.id);
      return c.json({ 
        error: 'حساب کاربری شما مسدود شده است. لطفاً با پشتیبانی تماس بگیرید.' 
      }, 403 as any);
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
      console.log('⏰ [OTP LOGIN] Rate limited, time left:', timeLeft);
      return c.json({ error: `لطفاً ${timeLeft} ثانیه دیگر صبر کنید` }, 429 as any);
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

    console.log('✅ [OTP LOGIN] OTP code created for:', normalizedPhone);

    try {
      const sent = await sendSMS(normalizedPhone, code, { retries: 2 });
      
      if (!sent) {
        throw new Error('SMS provider returned no success');
      }
      
      console.log('✅ [OTP LOGIN] SMS sent successfully');
    } catch (e) {
      console.error('❌ [OTP LOGIN] sendSMS failed:', e);
      await prisma.otpCode.deleteMany({ 
        where: { phone: normalizedPhone, code, purpose: 'login' } 
      });
      return c.json({ error: 'ارسال پیامک ناموفق بود' }, 500 as any);
    }

    return c.json({
      message: 'کد تایید برای ورود ارسال شد',
      phone: normalizedPhone,
      expiresIn: 120,
      ...(process.env.TEST_ECHO_OTP === 'true' ? { debugCode: code } : {})
    });

  } catch (error) {
    console.error('❌ [OTP LOGIN] Error:', error);
    return c.json({ error: 'خطای سرور' }, 500 as any);
  }
});

// OTP Login Verification - Verify OTP and login user
otpRouter.post('/auth/otp/login/verify', async (c) => {
  console.log('🚀 [OTP LOGIN VERIFY] Route called - POST /api/auth/otp/login/verify');
  
  try {
    const rl = await rateLimit(c.req.raw, { key: 'otp_login_verify', windowMs: 60_000, limit: 10 });
    if (rl.error) {
      console.log('❌ [OTP LOGIN VERIFY] Rate limit exceeded:', rl.error);
      return c.json(rl.error.body, rl.error.status as any);
    }

    const { phone, code } = await c.req.json();
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    
    console.log('📱 [OTP LOGIN VERIFY] Request data:', { phone: rawPhone, codeLength: code?.length });
    
    if (!rawPhone || !code) {
      console.log('❌ [OTP LOGIN VERIFY] Missing phone or code');
      return c.json({ error: 'شماره و کد الزامی است' }, 400 as any);
    }

    const normalizedPhone = normalizeIranPhone(rawPhone);
    console.log('📱 [OTP LOGIN VERIFY] Normalized phone:', normalizedPhone);

    // Find valid OTP
    const otp = await prisma.otpCode.findFirst({
      where: { 
        phone: normalizedPhone, 
        purpose: 'login', 
        code, 
        expiresAt: { gt: new Date() }, 
        isUsed: false 
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      console.log('❌ [OTP LOGIN VERIFY] No valid OTP found for:', normalizedPhone);
      return c.json({ error: 'کد نامعتبر یا منقضی شده است' }, 400 as any);
    }

    // Check attempts limit
    if (otp.attempts >= 3) {
      console.log('❌ [OTP LOGIN VERIFY] Too many attempts for OTP:', otp.id);
      return c.json({ 
        error: 'تعداد تلاش‌ها بیش از حد مجاز. لطفاً کد جدید درخواست دهید' 
      }, 429 as any);
    }

    // Find user
    const user = await prisma.user.findFirst({ 
      where: { phone: normalizedPhone },
      select: { 
        id: true, 
        name: true, 
        phone: true, 
        role: true, 
        status: true,
        grade: true,
        field: true,
        city: true,
        isVerified: true
      }
    });

    if (!user) {
      console.log('❌ [OTP LOGIN VERIFY] User not found for phone:', normalizedPhone);
      return c.json({ error: 'کاربر یافت نشد' }, 404 as any);
    }
    
    console.log('✅ [OTP LOGIN VERIFY] User found:', { id: user.id, name: user.name, role: user.role, status: user.status });

    if (user.status === 'SUSPENDED') {
      console.log('❌ [OTP LOGIN VERIFY] User suspended:', user.id);
      return c.json({ 
        error: 'حساب کاربری شما مسدود شده است' 
      }, 403 as any);
    }

    // Mark OTP as used
    await prisma.otpCode.update({ 
      where: { id: otp.id }, 
      data: { isUsed: true } 
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Create session token
    try {
      const tokenPayload = {
        sub: user.id,
        name: user.name ?? null,
        email: `${user.phone}@local.host`,
        role: user.role,
        phone: user.phone,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 days
      };

      const isProd = process.env.NODE_ENV === 'production';
      const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
      const secret = process.env.AUTH_SECRET || 'development-insecure-auth-secret-change-me';
      const sessionToken = await encodeJwt({
        token: tokenPayload,
        secret,
        maxAge: 60 * 60 * 24 * 30,
        salt: cookieName,
      });

      const cookieOptions = [
        `${cookieName}=${sessionToken}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${60 * 60 * 24 * 30}`,
      ];
      
      if (isProd) {
        cookieOptions.push('Secure');
      }
      
      // Add domain for localhost development
      if (!isProd) {
        cookieOptions.push('Domain=localhost');
      }

      const cookieHeader = cookieOptions.join('; ');

      console.log('✅ [OTP LOGIN VERIFY] Session created:', {
        userId: user.id,
        role: user.role,
        phone: user.phone,
      });

      // Determine redirect URL based on role
      const nextUrl = user.role === 'ADMIN' ? '/admin' : '/student-dashboard';

      return new Response(JSON.stringify({
        success: true,
        message: 'ورود با موفقیت انجام شد',
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          grade: user.grade,
          field: user.field,
          city: user.city,
          isVerified: user.isVerified,
        },
        nextUrl,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      });
    } catch (e) {
      console.error('❌ [OTP LOGIN VERIFY] Cookie creation failed:', e?.message || e);
      return c.json({
        success: true,
        message: 'ورود با موفقیت انجام شد',
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          grade: user.grade,
          field: user.field,
          city: user.city,
          isVerified: user.isVerified,
        },
        nextUrl: user.role === 'ADMIN' ? '/admin' : '/student-dashboard',
        requireManualLogin: true,
      }, 200 as any);
    }

  } catch (error) {
    console.error('❌ [OTP LOGIN VERIFY] Error:', error);
    return c.json({ error: 'خطای سرور' }, 500 as any);
  }
});

otpRouter.post('/auth/otp/send', async (c) => {
  console.log('🚀 [OTP DIRECT] Route called - POST /api/auth/otp/send');
  
  try {
    console.log('⏱️ [OTP DIRECT] Starting rate limit check...');
    const rl = await rateLimit(c.req.raw, { key: 'register', windowMs: 60_000, limit: 10 });
    if (rl.error) {
      console.log('❌ [OTP DIRECT] Rate limit exceeded:', rl.error);
      return c.json(rl.error.body, rl.error.status as any);
    }
    console.log('✅ [OTP DIRECT] Rate limit check passed');

    console.log('📝 [OTP DIRECT] Parsing request body...');
    const { phone } = await c.req.json();
    console.log('📱 [OTP DIRECT] Raw phone from request:', phone);
    
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    console.log('🔧 [OTP DIRECT] Processed phone:', rawPhone);
    
    if (!rawPhone) {
      console.log('❌ [OTP DIRECT] No phone provided');
      return c.json({ error: 'شماره موبایل الزامی است' }, 400 as any);
    }

    console.log('🔍 [OTP DIRECT] Validating phone format...');
    const phoneRegex = /^(?:\+98|0098|98|0)?9\d{9}$/;
    const isValidFormat = phoneRegex.test(rawPhone);
    console.log('📱 [OTP DIRECT] Phone format valid:', isValidFormat, 'for phone:', rawPhone);
    
    if (!isValidFormat) {
      console.log('❌ [OTP DIRECT] Invalid phone format');
      return c.json({ error: 'فرمت شماره موبایل معتبر نیست' }, 400 as any);
    }

    console.log('🔄 [OTP DIRECT] Normalizing phone number...');
    const normalizedPhone = normalizeIranPhone(rawPhone);
    console.log('📱 [OTP DIRECT] Normalized phone:', normalizedPhone);

    // Check if user already exists
    console.log('🔍 [OTP DIRECT] Checking if user already exists...');
    try {
      const existingUser = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
      console.log('👤 [OTP DIRECT] Existing user check result:', existingUser ? 'User exists' : 'User not found');
      if (existingUser) {
        console.log('❌ [OTP DIRECT] User already exists, returning error');
        return c.json({ 
          error: 'این شماره موبایل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.', 
          errorCode: 'USER_EXISTS' 
        }, 409 as any);
      }
    } catch (dbError) {
      console.warn('⚠️ [OTP DIRECT] Database check failed, continuing with mock mode:', dbError.message);
    }

    // Check for recent OTP requests
    console.log('⏰ [OTP DIRECT] Checking for recent OTP requests...');
    let recent: any = null;
    try {
      recent = await prisma.otpCode.findFirst({
        where: { phone: normalizedPhone, createdAt: { gte: new Date(Date.now() - 120_000) } },
        orderBy: { createdAt: 'desc' }
      });
      console.log('📅 [OTP DIRECT] Recent OTP check result:', recent ? 'Found recent request' : 'No recent requests');
    } catch (dbError) {
      console.warn('⚠️ [OTP DIRECT] Database resend check failed, continuing:', dbError.message);
    }
    
    if (recent) {
      const timeLeft = Math.ceil((recent.createdAt.getTime() + 120_000 - Date.now()) / 1000);
      console.log('⏳ [OTP DIRECT] Rate limit active, time left:', timeLeft, 'seconds');
      return c.json({ error: `لطفاً ${timeLeft} ثانیه دیگر صبر کنید` }, 429 as any);
    }

    console.log('🎲 [OTP DIRECT] Generating OTP code...');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    console.log('🔢 [OTP DIRECT] Generated OTP code:', code, 'expires at:', expiresAt.toISOString());
    
    // Store OTP code in database
    console.log('💾 [OTP DIRECT] Storing OTP code in database...');
    const storedOtp = await prisma.otpCode.create({ 
      data: { 
        phone: normalizedPhone, 
        code, 
        purpose: 'signup', 
        expiresAt 
      } 
    });
    console.log('✅ [OTP DIRECT] OTP code stored successfully with ID:', storedOtp.id);

    console.log('📱 [OTP DIRECT] Attempting to send SMS...');
    try {
      console.log('📤 [OTP DIRECT] Calling sendSMS with:', { phone: normalizedPhone, code, retries: 2 });
      const sent = await sendSMS(normalizedPhone, code, { retries: 2 });
      console.log('📱 [OTP DIRECT] SMS send result:', sent);
      
      if (!sent) {
        console.log('❌ [OTP DIRECT] SMS provider returned no success');
        throw new Error('SMS provider returned no success');
      }
      console.log('✅ [OTP DIRECT] SMS sent successfully');
    } catch (e) {
      console.error('❌ [OTP DIRECT] sendSMS failed:', e);
      console.log('🧹 [OTP DIRECT] Attempting database cleanup...');
      try {
        await prisma.otpCode.deleteMany({ where: { phone: normalizedPhone, code, purpose: 'signup' } });
        console.log('✅ [OTP DIRECT] Database cleanup successful');
      } catch (dbError) {
        console.warn('⚠️ [OTP DIRECT] Database cleanup failed:', dbError.message);
      }
      return c.json({ error: 'ارسال پیامک ناموفق بود' }, 500 as any);
    }

    console.log('🎉 [OTP DIRECT] Success! Preparing response...');
    const response = {
      message: 'کد تایید ارسال شد',
      phone: normalizedPhone,
      expiresIn: 120,
      ...(process.env.TEST_ECHO_OTP === 'true' ? { debugCode: code } : {})
    };
    console.log('📤 [OTP DIRECT] Final response:', response);
    return c.json(response);
  } catch (error) {
    console.error('💥 [OTP DIRECT] Unexpected error:', error);
    console.error('💥 [OTP DIRECT] Error stack:', error.stack);
    return c.json({ error: 'خطای سرور' }, 500 as any);
  }
});

otpRouter.post('/auth/otp/verify', async (c) => {
  console.log('🚀 [OTP VERIFY] Route called - POST /api/auth/otp/verify');
  
  try {
    console.log('⏱️ [OTP VERIFY] Starting rate limit check...');
    const rl = await rateLimit(c.req.raw, { key: 'verify', windowMs: 60_000, limit: 10 });
    if (rl.error) {
      console.log('❌ [OTP VERIFY] Rate limit exceeded:', rl.error);
      return c.json(rl.error.body, rl.error.status as any);
    }
    console.log('✅ [OTP VERIFY] Rate limit check passed');

    console.log('📝 [OTP VERIFY] Parsing request body...');
    const { phone, code } = await c.req.json();
    console.log('📱 [OTP VERIFY] Raw phone from request:', phone);
    console.log('🔢 [OTP VERIFY] Raw code from request:', code);
    
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    const rawCode = String(code || '').trim();
    
    if (!rawPhone || !rawCode) {
      console.log('❌ [OTP VERIFY] Missing phone or code');
      return c.json({ error: 'شماره موبایل و کد تایید الزامی است' }, 400 as any);
    }

    console.log('🔄 [OTP VERIFY] Normalizing phone number...');
    const normalizedPhone = normalizeIranPhone(rawPhone);
    console.log('📱 [OTP VERIFY] Normalized phone:', normalizedPhone);

    console.log('🔍 [OTP VERIFY] Looking for OTP record...');
    try {
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          phone: normalizedPhone,
          code: rawCode,
          purpose: 'signup',
          expiresAt: { gt: new Date() },
          isUsed: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        console.log('❌ [OTP VERIFY] Invalid or expired OTP');
        return c.json({ error: 'کد تایید نامعتبر یا منقضی شده است' }, 400 as any);
      }

      console.log('✅ [OTP VERIFY] Valid OTP found, marking as used...');
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }
      });

      console.log('🎉 [OTP VERIFY] OTP verified successfully!');
      return c.json({
        message: 'کد تایید صحیح است',
        phone: normalizedPhone,
        verified: true
      });

    } catch (dbError) {
      console.warn('⚠️ [OTP VERIFY] Database error, but continuing:', dbError.message);
      // In mock mode, accept any code
      console.log('🎭 [OTP VERIFY] Mock mode - accepting any code');
      return c.json({
        message: 'کد تایید صحیح است (Mock Mode)',
        phone: normalizedPhone,
        verified: true,
        mockMode: true
      });
    }

  } catch (error) {
    console.error('💥 [OTP VERIFY] Unexpected error:', error);
    console.error('💥 [OTP VERIFY] Error stack:', error.stack);
    return c.json({ error: 'خطای سرور' }, 500 as any);
  }
});

otpRouter.post('/auth/complete-registration', async (c) => {
  console.log('🚀 [COMPLETE REGISTRATION] Route called - POST /api/auth/complete-registration');
  
  try {
    console.log('⏱️ [COMPLETE REGISTRATION] Starting rate limit check...');
    const rl = await rateLimit(c.req.raw, { key: 'complete_registration', windowMs: 60_000, limit: 5 });
    if (rl.error) {
      console.log('❌ [COMPLETE REGISTRATION] Rate limit exceeded:', rl.error);
      return c.json(rl.error.body, rl.error.status as any);
    }
    console.log('✅ [COMPLETE REGISTRATION] Rate limit check passed');

    console.log('📝 [COMPLETE REGISTRATION] Parsing request body...');
    const parsed = await c.req.json();
    console.log('📋 [COMPLETE REGISTRATION] Request data:', parsed);

    // Extract fields
    const phone = parsed?.phone ?? parsed?.mobileNumber;
    const { code, otp, name, password, grade, field, city, province } = parsed || {};
    const otpCode = code ?? otp;

    // Validation
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    if (!rawPhone) {
      console.log('❌ [COMPLETE REGISTRATION] No phone provided');
      return c.json({ error: 'شماره موبایل الزامی است' }, 400 as any);
    }

    if (!otpCode || String(otpCode).length !== 6) {
      console.log('❌ [COMPLETE REGISTRATION] Invalid OTP code');
      return c.json({ error: 'کد تایید ۶ رقمی الزامی است' }, 400 as any);
    }

    if (!name || String(name).trim().length < 2) {
      console.log('❌ [COMPLETE REGISTRATION] Invalid name');
      return c.json({ error: 'نام و نام خانوادگی الزامی است' }, 400 as any);
    }

    if (!password || String(password).length < 8) {
      console.log('❌ [COMPLETE REGISTRATION] Invalid password');
      return c.json({ error: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }, 400 as any);
    }

    console.log('🔄 [COMPLETE REGISTRATION] Normalizing phone number...');
    const normalizedPhone = normalizeIranPhone(rawPhone);
    console.log('📱 [COMPLETE REGISTRATION] Normalized phone:', normalizedPhone);

    // Step 1: Verify OTP
    console.log('🔍 [COMPLETE REGISTRATION] Verifying OTP...');
    try {
      const validOtp = await prisma.otpCode.findFirst({
        where: {
          phone: normalizedPhone,
          code: String(otpCode),
          purpose: 'signup',
          expiresAt: { gt: new Date() },
          isUsed: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!validOtp) {
        console.log('❌ [COMPLETE REGISTRATION] Invalid or expired OTP');
        return c.json({ error: 'کد تایید نامعتبر یا منقضی شده است' }, 400 as any);
      }

      console.log('✅ [COMPLETE REGISTRATION] OTP verified successfully');

      // Check attempts limit
      if (validOtp.attempts >= 5) {
        console.log('❌ [COMPLETE REGISTRATION] Too many attempts');
        return c.json({ 
          error: 'تعداد تلاش‌ها بیش از حد مجاز. لطفاً کد جدید درخواست دهید' 
        }, 429);
      }

      // Step 2: Check if user already exists
      console.log('🔍 [COMPLETE REGISTRATION] Checking if user already exists...');
      const existingUser = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
      });

      if (existingUser) {
        console.log('❌ [COMPLETE REGISTRATION] User already exists');
        return c.json({ 
          error: 'این شماره موبایل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.' 
        }, 409);
      }

      // Step 3: Hash password
      console.log('🔐 [COMPLETE REGISTRATION] Hashing password...');
      const hashedPassword = await argonHash(String(password));

      // Step 4: Create new user
      console.log('👤 [COMPLETE REGISTRATION] Creating new user...');
      const newUser = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          name: String(name).trim(),
          password: hashedPassword,
          role: 'STUDENT',
          grade: grade ? String(grade).trim() : null,
          field: field ? String(field).trim() : null,
          city: city ? String(city).trim() : (province ? String(province).trim() : null),
          phoneVerifiedAt: new Date(),
          isVerified: true,
          status: 'ACTIVE',
          lastLogin: new Date(),
        },
      });

      console.log('✅ [COMPLETE REGISTRATION] User created successfully:', newUser.id);

      // Step 5: Mark OTP as used
      console.log('🏷️ [COMPLETE REGISTRATION] Marking OTP as used...');
      await prisma.otpCode.update({
        where: { id: validOtp.id },
        data: { isUsed: true },
      });

      // Step 6: Auto-login by issuing Auth.js-compatible session cookie
      console.log('🍪 [COMPLETE REGISTRATION] Creating session cookie...');
      try {
        const tokenPayload = {
          sub: newUser.id,
          name: newUser.name ?? null,
          email: `${newUser.phone}@local.host`,
          role: newUser.role,
          phone: newUser.phone,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 days
        };

        const isProd = process.env.NODE_ENV === 'production';
        const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
        const secret = process.env.AUTH_SECRET || 'development-insecure-auth-secret-change-me';
        const sessionToken = await encodeJwt({
          token: tokenPayload,
          secret,
          maxAge: 60 * 60 * 24 * 30,
          salt: cookieName,
        });

        const cookieOptions = [
          `${cookieName}=${sessionToken}`,
          'Path=/',
          'HttpOnly',
          'SameSite=Lax',
          `Max-Age=${60 * 60 * 24 * 30}`,
        ];
        
        if (isProd) {
          cookieOptions.push('Secure');
        }

        const cookieHeader = cookieOptions.join('; ');

        console.log('✅ [COMPLETE REGISTRATION] Session cookie created successfully');

        return new Response(JSON.stringify({
          success: true,
          message: 'ثبت‌نام با موفقیت انجام شد و شما به صورت خودکار وارد شدید.',
          user: {
            id: newUser.id,
            phone: newUser.phone,
            name: newUser.name,
            role: newUser.role,
            grade: newUser.grade,
            field: newUser.field,
            city: newUser.city,
            isVerified: newUser.isVerified,
          },
          nextUrl: '/student-dashboard',
        }), {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': cookieHeader,
          },
        });
      } catch (e) {
        console.error('❌ [COMPLETE REGISTRATION] Cookie creation failed:', e?.message || e);
        // fallback: still return success without cookie
        return c.json({
          success: true,
          message: 'ثبت‌نام با موفقیت انجام شد. لطفاً وارد شوید.',
          user: {
            id: newUser.id,
            phone: newUser.phone,
            name: newUser.name,
            role: newUser.role,
            grade: newUser.grade,
            field: newUser.field,
            city: newUser.city,
            isVerified: newUser.isVerified,
          },
          requireLogin: true,
        }, 201);
      }

    } catch (dbError) {
      console.error('❌ [COMPLETE REGISTRATION] Database error:', dbError);
      return c.json({ 
        error: 'خطای سرور در تکمیل ثبت‌نام. لطفاً دوباره تلاش کنید.' 
      }, 500);
    }

  } catch (error) {
    console.error('💥 [COMPLETE REGISTRATION] Unexpected error:', error);
    console.error('💥 [COMPLETE REGISTRATION] Error stack:', error.stack);
    return c.json({ error: 'خطای سرور' }, 500 as any);
  }
});

export default otpRouter;
