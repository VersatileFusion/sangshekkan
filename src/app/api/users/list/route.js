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

    // Parse query parameters for cursor-based pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const cursor = url.searchParams.get('cursor') || null;

    // Get pinned users (always return all pinned users)
    const pinnedUsers = await prisma.user.findMany({
      where: { 
        pinned: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        grade: true,
        field: true,
        city: true,
        profileImageUrl: true,
        bio: true,
        officeAddress: true,
        landlinePhone: true,
        createdAt: true,
        pinned: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build query for other users (cursor-based)
    const otherUsersQuery = {
      where: { 
        pinned: false,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        role: true,
        grade: true,
        field: true,
        profileImageUrl: true,
        createdAt: true,
        pinned: true,
      },
      take: limit + 1, // Take one extra to determine if there are more
      orderBy: { createdAt: 'desc' },
    };

    // Add cursor if provided
    if (cursor) {
      otherUsersQuery.cursor = { id: cursor };
      otherUsersQuery.skip = 1; // Skip the cursor itself
    }

    // Get other users with cursor
    const otherUsersWithExtra = await prisma.user.findMany(otherUsersQuery);

    // Check if there are more items
    const hasMore = otherUsersWithExtra.length > limit;
    const otherUsers = hasMore ? otherUsersWithExtra.slice(0, limit) : otherUsersWithExtra;

    // Get the next cursor (last item's id)
    const nextCursor = hasMore && otherUsers.length > 0 
      ? otherUsers[otherUsers.length - 1].id 
      : null;

    return Response.json({
      pinnedUsers,
      otherUsers,
      nextCursor,
      hasMore,
    });

  } catch (error) {
    console.error('Error in users list:', error);
    return Response.json(
      { error: 'خطا در دریافت لیست کاربران' },
      { status: 500 }
    );
  }
}

