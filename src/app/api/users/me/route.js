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

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return Response.json({ error: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }

    return Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        grade: user.grade,
        field: user.field,
        city: user.city,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        officeAddress: user.officeAddress,
        landlinePhone: user.landlinePhone,
        status: user.status,
        isVerified: user.isVerified,
        phoneVerifiedAt: user.phoneVerifiedAt,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      }
    });

  } catch (error) {
    console.error('Error in GET /api/users/me:', error);
    return Response.json(
      { error: 'خطا در دریافت اطلاعات کاربر' },
      { status: 500 }
    );
  }
}
