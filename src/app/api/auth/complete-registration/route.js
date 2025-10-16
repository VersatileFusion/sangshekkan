import prisma from "@/app/api/utils/prisma";
import { hash as argonHash } from "argon2";
import { rateLimit } from "@/app/api/utils/rateLimit";
import { normalizeIranPhone, notifySangshekanOnSignup } from "@/app/api/utils/sms";
import { encode as encodeJwt } from "@auth/core/jwt";

/**
 * Complete Registration Endpoint
 * This endpoint handles the final step of user registration after OTP verification
 * It creates a new user with all provided information and sets up their account
 */
export async function POST(request) {
  try {
    const rl = await rateLimit(request, { key: 'complete_registration', windowMs: 60_000, limit: 5 });
    if (rl.error) return rl.error;

    // Robust JSON parsing
    let parsed = {};
    try {
      const raw = await request.text();
      parsed = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Extract fields - support multiple aliases
    const phone = parsed?.phone ?? parsed?.mobileNumber;
    const { code, otp, name, password, grade, field, city, province } = parsed || {};
    const otpCode = code ?? otp;

    // Validation
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    if (!rawPhone) {
      return Response.json({ error: 'شماره موبایل الزامی است' }, { status: 400 });
    }

    if (!otpCode || String(otpCode).length !== 6) {
      return Response.json({ error: 'کد تایید ۶ رقمی الزامی است' }, { status: 400 });
    }

    if (!name || String(name).trim().length < 2) {
      return Response.json({ error: 'نام و نام خانوادگی الزامی است' }, { status: 400 });
    }

    if (!password || String(password).length < 8) {
      return Response.json({ error: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }, { status: 400 });
    }

    const normalizedPhone = normalizeIranPhone(rawPhone);

    // Step 1: Verify OTP
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
      return Response.json({ error: 'کد تایید نامعتبر یا منقضی شده است' }, { status: 400 });
    }

    // Check attempts limit
    if (validOtp.attempts >= 5) {
      return Response.json({ 
        error: 'تعداد تلاش‌ها بیش از حد مجاز. لطفاً کد جدید درخواست دهید' 
      }, { status: 429 });
    }

    // Step 2: Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      return Response.json({ 
        error: 'این شماره موبایل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.' 
      }, { status: 409 });
    }

    // Step 3: Hash password
    const hashedPassword = await argonHash(String(password));

    // Step 4: Create new user with all information
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

    // Step 5: Mark OTP as used
    await prisma.otpCode.update({
      where: { id: validOtp.id },
      data: { isUsed: true },
    });

    // Step 6: Send notification to advisor (Mrs. Sangshekan)
    try {
      await notifySangshekanOnSignup(normalizedPhone);
    } catch (notifyError) {
      console.error('Failed to send advisor notification:', notifyError);
      // Don't fail the registration if notification fails
    }

    // Step 7: Auto-login by issuing Auth.js-compatible session cookie
    try {
      // 1) Complete JWT payload matching Auth.js expected structure
      const tokenPayload = {
        sub: newUser.id, // User ID as 'sub' (subject)
        name: newUser.name ?? null,
        email: newUser.email ?? `${newUser.phone}@local.host`, // Fallback email from phone
        role: newUser.role, // ✅ CRITICAL: Role for authorization
        phone: newUser.phone, // ✅ Phone for additional context
        iat: Math.floor(Date.now() / 1000), // Issued at
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // Expires in 30 days
      };

      // 3) Determine cookie name and encode JWT using Auth.js encoder with explicit salt
      const isProd = process.env.NODE_ENV === 'production';
      const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
      const secret = process.env.AUTH_SECRET || 'development-insecure-auth-secret-change-me';
      const sessionToken = await encodeJwt({
        token: tokenPayload,
        secret,
        maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
        salt: cookieName,
      });

      const cookieOptions = [
        `${cookieName}=${sessionToken}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${60 * 60 * 24 * 30}`, // 30 days
      ];
      
      if (isProd) {
        cookieOptions.push('Secure');
      }

      const cookieHeader = cookieOptions.join('; ');

      console.log('[Auto-Login] Session cookie created:', {
        userId: newUser.id,
        role: newUser.role,
        cookieName,
        tokenPreview: sessionToken.substring(0, 20) + '...',
      });

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
      console.error('[Auto-Login] Cookie creation failed:', e?.message || e, e?.stack);
      // fallback: still return success without cookie
      return Response.json({
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
        requireLogin: true, // Flag to indicate manual login needed
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Complete registration error:', error);
    return Response.json({ 
      error: 'خطای سرور در تکمیل ثبت‌نام. لطفاً دوباره تلاش کنید.' 
    }, { status: 500 });
  }
}

