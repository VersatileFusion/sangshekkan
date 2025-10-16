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

// PUT - Update admin profile
export async function PUT(request) {
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
    const { name, phone, landlinePhone, officeAddress, bio } = body;

    // Validate required fields
    if (!name || !phone) {
      return Response.json({ error: 'نام و شماره موبایل الزامی است' }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        landlinePhone: landlinePhone ? landlinePhone.trim() : null,
        officeAddress: officeAddress ? officeAddress.trim() : null,
        bio: bio ? bio.trim() : null,
      },
    });

    return Response.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        landlinePhone: updatedUser.landlinePhone,
        officeAddress: updatedUser.officeAddress,
        bio: updatedUser.bio,
      },
    });

  } catch (error) {
    console.error('Error updating admin profile:', error);
    return Response.json({ error: 'خطا در به‌روزرسانی پروفایل' }, { status: 500 });
  }
}

