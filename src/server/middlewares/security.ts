import type { MiddlewareHandler } from 'hono';

// Minimal security headers for APIs. CSP is disabled in development.
export const security: MiddlewareHandler = async (c, next) => {
  // Basic hardening headers suitable for APIs
  c.header('X-DNS-Prefetch-Control', 'off');
  c.header('X-Frame-Options', 'SAMEORIGIN');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Cross-Origin-Resource-Policy', 'same-site');
  // Content-Security-Policy intentionally omitted (disabled) for API/dev
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  await next();
};




