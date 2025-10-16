import type { MiddlewareHandler } from 'hono';
import prisma from '@/app/api/utils/prisma';

/**
 * Middleware: بررسی وضعیت کاربر (مسدود شده یا خیر)
 * این middleware باید بعد از isAuthenticated فراخوانی شود
 * اگر کاربر مسدود شده باشد، خطای 403 برمی‌گرداند
 */
export const checkUserStatus: MiddlewareHandler = async (c, next) => {
  const userId = c.get('userId') as string;

  if (!userId) {
    const err = new Error('User ID not found in context');
    ;(err as any).status = 401;
    ;(err as any).code = 'UNAUTHORIZED';
    throw err;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        accessSuspendedAt: true,
        name: true,
      },
    });

    if (!user) {
      console.error(`⚠️ [CheckUserStatus] User not found: ${userId}`);
      const err = new Error('User not found');
      ;(err as any).status = 404;
      ;(err as any).code = 'USER_NOT_FOUND';
      throw err;
    }

    // بررسی وضعیت مسدود شدن
    if (user.status === 'SUSPENDED' || user.accessSuspendedAt !== null) {
      console.warn(`🚫 [CheckUserStatus] Blocked user attempted access: ${user.name} (${userId})`);
      const err = new Error('دسترسی شما مسدود شده است. لطفاً با پشتیبانی تماس بگیرید.');
      ;(err as any).status = 403;
      ;(err as any).code = 'USER_BLOCKED';
      throw err;
    }

    console.log(`✅ [CheckUserStatus] User ${user.name} (${userId}) status: ${user.status}`);
    
    // ذخیره اطلاعات کاربر در context برای استفاده در handlerهای بعدی
    c.set('user', user);
    
    await next();
  } catch (error: any) {
    // اگر خطا از قبل throw شده، دوباره throw کن
    if (error.status) {
      throw error;
    }
    
    // خطای غیرمنتظره
    console.error('❌ [CheckUserStatus] Error:', error);
    const err = new Error('خطا در بررسی وضعیت کاربر');
    ;(err as any).status = 500;
    ;(err as any).code = 'INTERNAL_ERROR';
    throw err;
  }
};

export default checkUserStatus;

