import prisma from './prisma';

/**
 * Utility function برای بررسی وضعیت کاربر مسدود شده
 * برای استفاده در Next.js API Routes که از auth() استفاده می‌کنند
 * 
 * @param userId - شناسه کاربر
 * @returns user object اگر کاربر مسدود نباشد
 * @throws Error با message مناسب اگر کاربر مسدود باشد یا یافت نشود
 */
export async function checkUserBlocked(userId: string) {
  if (!userId) {
    throw new Error('USER_ID_REQUIRED');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      status: true,
      accessSuspendedAt: true,
    },
  });

  if (!user) {
    console.error(`⚠️ [checkUserBlocked] User not found: ${userId}`);
    throw new Error('USER_NOT_FOUND');
  }

  // بررسی وضعیت مسدود شدن
  if (user.status === 'SUSPENDED' || user.accessSuspendedAt !== null) {
    console.warn(`🚫 [checkUserBlocked] Blocked user attempted access: ${user.name} (${userId})`);
    throw new Error('USER_BLOCKED');
  }

  console.log(`✅ [checkUserBlocked] User ${user.name} (${userId}) status: ${user.status}`);
  
  return user;
}

/**
 * Helper function برای مدیریت خطاهای مربوط به بررسی کاربر
 * 
 * @param error - خطای رخ داده
 * @returns Response object با status و message مناسب
 */
export function handleUserBlockedError(error: any) {
  if (error.message === 'USER_BLOCKED') {
    return Response.json(
      { error: 'دسترسی شما مسدود شده است. لطفاً با پشتیبانی تماس بگیرید.' },
      { status: 403 }
    );
  }
  
  if (error.message === 'USER_NOT_FOUND') {
    return Response.json(
      { error: 'کاربر یافت نشد' },
      { status: 404 }
    );
  }
  
  if (error.message === 'USER_ID_REQUIRED') {
    return Response.json(
      { error: 'شناسه کاربر الزامی است' },
      { status: 400 }
    );
  }
  
  // خطای عمومی
  console.error('❌ [handleUserBlockedError] Unexpected error:', error);
  return Response.json(
    { error: 'خطای سرور' },
    { status: 500 }
  );
}

