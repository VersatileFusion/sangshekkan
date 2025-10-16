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

// Get or create admin settings
async function getAdminSettings() {
  let settings = await prisma.adminSettings.findFirst();
  
  if (!settings) {
    settings = await prisma.adminSettings.create({
      data: {
        allowGuestChat: true,
        blockedPhones: [],
      },
    });
  }
  
  return settings;
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return Response.json({ error: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return Response.json({ error: 'شما دسترسی لازم برای این عملیات را ندارید' }, { status: 403 });
    }

    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return Response.json({ error: 'شماره تلفن الزامی است' }, { status: 400 });
    }

    // Get current settings
    const settings = await getAdminSettings();
    
    // Get current blocked phones array
    const blockedPhones = Array.isArray(settings.blockedPhones) 
      ? settings.blockedPhones 
      : [];

    // Check if already blocked
    if (blockedPhones.includes(phone)) {
      return Response.json({ error: 'این شماره قبلاً مسدود شده است' }, { status: 400 });
    }

    // Add phone to blocked list
    const updatedBlockedPhones = [...blockedPhones, phone];

    // Update settings
    await prisma.adminSettings.update({
      where: { id: settings.id },
      data: {
        blockedPhones: updatedBlockedPhones,
      },
    });

    console.log(`[Admin] Blocked phone: ${phone} by admin ${user.id}`);

    return Response.json({
      success: true,
      message: 'شماره تلفن با موفقیت مسدود شد',
    });

  } catch (error) {
    console.error('Error blocking phone:', error);
    return Response.json(
      { error: 'خطا در مسدود کردن شماره' },
      { status: 500 }
    );
  }
}

// DELETE - Unblock phone
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return Response.json({ error: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return Response.json({ error: 'شما دسترسی لازم برای این عملیات را ندارید' }, { status: 403 });
    }

    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return Response.json({ error: 'شماره تلفن الزامی است' }, { status: 400 });
    }

    // Get current settings
    const settings = await getAdminSettings();
    
    // Get current blocked phones array
    const blockedPhones = Array.isArray(settings.blockedPhones) 
      ? settings.blockedPhones 
      : [];

    // Remove phone from blocked list
    const updatedBlockedPhones = blockedPhones.filter(p => p !== phone);

    // Update settings
    await prisma.adminSettings.update({
      where: { id: settings.id },
      data: {
        blockedPhones: updatedBlockedPhones,
      },
    });

    console.log(`[Admin] Unblocked phone: ${phone} by admin ${user.id}`);

    return Response.json({
      success: true,
      message: 'شماره تلفن با موفقیت از لیست مسدودی حذف شد',
    });

  } catch (error) {
    console.error('Error unblocking phone:', error);
    return Response.json(
      { error: 'خطا در حذف شماره از لیست مسدودی' },
      { status: 500 }
    );
  }
}

