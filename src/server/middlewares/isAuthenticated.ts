import type { MiddlewareHandler } from 'hono';
import { getToken } from '@auth/core/jwt';

export const isAuthenticated: MiddlewareHandler = async (c, next) => {
  const token = await getToken({
    req: c.req.raw,
    secret: process.env.AUTH_SECRET,
    secureCookie: Boolean(process.env.AUTH_URL && process.env.AUTH_URL.startsWith('https')),
  });

  if (!token || !token.sub) {
    const err = new Error('Unauthorized');
    ;(err as any).status = 401;
    ;(err as any).code = 'UNAUTHORIZED';
    throw err;
  }

  // Expose current user id for downstream handlers
  c.set('userId', String(token.sub));
  await next();
};

export default isAuthenticated;


