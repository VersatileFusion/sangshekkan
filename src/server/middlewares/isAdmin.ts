import type { MiddlewareHandler } from 'hono';
import prisma from '@/app/api/utils/prisma';

/**
 * Admin authorization middleware
 * Requires isAuthenticated middleware to run first (sets c.get('userId'))
 * Loads user from database and ensures role === 'ADMIN'
 * Sets c.set('adminId', userId) for downstream handlers
 * Throws 403 if user is not an admin
 */
export const isAdmin: MiddlewareHandler = async (c, next) => {
  const userId = c.get('userId') as string | undefined;

  if (!userId) {
    const err = new Error('Authentication required');
    (err as any).status = 401;
    (err as any).code = 'UNAUTHORIZED';
    throw err;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true },
    });

    if (!user || user.role !== 'ADMIN') {
      const err = new Error('Admin access required');
      (err as any).status = 403;
      (err as any).code = 'FORBIDDEN';
      throw err;
    }

    // Expose admin user ID for downstream handlers
    c.set('adminId', user.id);
    c.set('adminName', user.name || 'Admin');
    
    await next();
  } catch (error) {
    // Re-throw our custom errors
    if ((error as any).status) {
      throw error;
    }
    
    // Database/unexpected errors
    console.error('isAdmin middleware error:', error);
    const err = new Error('Authorization check failed');
    (err as any).status = 500;
    (err as any).code = 'INTERNAL_ERROR';
    throw err;
  }
};

export default isAdmin;
