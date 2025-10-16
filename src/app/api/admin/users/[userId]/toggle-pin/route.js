import prisma from "@/app/api/utils/prisma";

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

async function togglePinHandler(request, { params }) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return Response.json({ error: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
  }

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    return Response.json({ error: 'شما دسترسی لازم برای این عملیات را ندارید' }, { status: 403 });
  }

  const { userId } = params;

  if (!userId) {
    return Response.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
  }

  // Get target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, pinned: true },
  });

  if (!targetUser) {
    return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  }

  // Toggle pinned status
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { pinned: !targetUser.pinned },
    select: {
      id: true,
      name: true,
      pinned: true,
      profileImageUrl: true,
      role: true,
      grade: true,
      field: true,
      phone: true,
    },
  });

  const action = updatedUser.pinned ? 'pinned' : 'unpinned';
  console.log(`[Admin] User ${updatedUser.name} (${updatedUser.id}) ${action} by admin ${user.id}`);

  return Response.json({
    success: true,
    message: updatedUser.pinned 
      ? 'کاربر به لیست اعضای ویژه اضافه شد'
      : 'کاربر از لیست اعضای ویژه حذف شد',
    user: updatedUser,
  });
}

export async function PUT(request, { params }) {
  try {
    return await togglePinHandler(request, { params });
  } catch (error) {
    console.error('Error toggling pin status:', error);
    return Response.json(
      { error: 'خطا در تغییر وضعیت پین' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    return await togglePinHandler(request, { params });
  } catch (error) {
    console.error('Error toggling pin status:', error);
    return Response.json(
      { error: 'خطا در تغییر وضعیت پین' },
      { status: 500 }
    );
  }
}

