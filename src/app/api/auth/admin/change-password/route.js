import prisma from "@/app/api/utils/prisma";
import { verify as argonVerify, hash as argonHash } from "argon2";
import { rateLimit } from "@/app/api/utils/rateLimit";

// Helper to get user from session cookie
async function getUserFromRequest(request) {
  try {
    const { decode } = await import('@auth/core/jwt');
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...v] = c.trim().split('=');
        return [key, v.join('=')];
      })
    );
    
    const sessionToken = cookies['authjs.session-token'] || cookies['__Secure-authjs.session-token'];
    if (!sessionToken) return null;

    const secret = process.env.AUTH_SECRET || 'development-insecure-auth-secret-change-me';
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-authjs.session-token' 
      : 'authjs.session-token';

    const payload = await decode({
      token: sessionToken,
      secret,
      salt: cookieName,
    });

    if (!payload?.sub) return null;

    return await prisma.user.findUnique({
      where: { id: payload.sub },
    });
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

// POST - Change password
export async function POST(request) {
  try {
    // Rate limiting: 5 attempts per 15 minutes
    const rl = await rateLimit(request, { 
      key: 'change_password', 
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 5 
    });
    
    if (rl.error) {
      return Response.json(
        { error: 'تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.' },
        { status: 429 }
      );
    }

    const user = await getUserFromRequest(request);
    
    if (!user) {
      return Response.json({ error: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return Response.json({ error: 'شما دسترسی لازم برای این عملیات را ندارید' }, { status: 403 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validation
    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'رمز عبور فعلی و جدید الزامی است' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد' }, { status: 400 });
    }

    if (!/\d/.test(newPassword)) {
      return Response.json({ error: 'رمز عبور باید حداقل یک عدد داشته باشد' }, { status: 400 });
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      return Response.json({ error: 'رمز عبور باید حداقل یک حرف داشته باشد' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return Response.json({ error: 'رمز عبور جدید نمی‌تواند با رمز فعلی یکسان باشد' }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await argonVerify(user.password, currentPassword).catch(() => false);
    
    if (!isPasswordValid) {
      return Response.json(
        { error: 'رمز عبور فعلی اشتباه است', field: 'currentPassword' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await argonHash(newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Log password change for security audit
    console.log(`[Security] Password changed for admin user: ${user.id} (${user.phone}) at ${new Date().toISOString()}`);

    return Response.json({
      success: true,
      message: 'رمز عبور شما با موفقیت تغییر کرد',
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return Response.json({ error: 'خطا در تغییر رمز عبور' }, { status: 500 });
  }
}

