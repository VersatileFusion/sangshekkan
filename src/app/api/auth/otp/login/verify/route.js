import prisma from "@/app/api/utils/prisma";
import { rateLimit } from "@/app/api/utils/rateLimit";
import { normalizeIranPhone } from "@/app/api/utils/sms";
import { encode as encodeJwt } from "@auth/core/jwt";

/**
 * OTP Login Verification - Verify OTP and login user
 */
export async function POST(request) {
  try {
    const rl = await rateLimit(request, { key: 'otp_login_verify', windowMs: 60_000, limit: 10 });
    if (rl.error) return rl.error;

    const { phone, code } = await request.json();
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    
    console.log('[OTP Login Verify] Request data:', { phone: rawPhone, codeLength: code?.length });
    
    if (!rawPhone || !code) {
      console.log('[OTP Login Verify] Missing phone or code');
      return Response.json({ error: 'شماره و کد الزامی است' }, { status: 400 });
    }

    const normalizedPhone = normalizeIranPhone(rawPhone);
    console.log('[OTP Login Verify] Normalized phone:', normalizedPhone);

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
      console.log('[OTP Login Verify] No valid OTP found for:', normalizedPhone);
      return Response.json({ error: 'کد نامعتبر یا منقضی شده است' }, { status: 400 });
    }

    // Check attempts limit
    if (otp.attempts >= 3) {
      return Response.json({ 
        error: 'تعداد تلاش‌ها بیش از حد مجاز. لطفاً کد جدید درخواست دهید' 
      }, { status: 429 });
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
      console.log('[OTP Login Verify] User not found for phone:', normalizedPhone);
      return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }
    
    console.log('[OTP Login Verify] User found:', { id: user.id, name: user.name, role: user.role, status: user.status });

    if (user.status === 'SUSPENDED') {
      return Response.json({ 
        error: 'حساب کاربری شما مسدود شده است' 
      }, { status: 403 });
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
      } else {
        // Add domain for localhost development
        cookieOptions.push('Domain=localhost');
      }

      const cookieHeader = cookieOptions.join('; ');

      console.log('[OTP Login] Session created:', {
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
      console.error('[OTP Login] Cookie creation failed:', e?.message || e);
      return Response.json({
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
      }, { status: 200 });
    }

  } catch (error) {
    console.error('OTP Login Verify error:', error);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
