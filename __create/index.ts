import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';
import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { authHandler, initAuthConfig } from '@hono/auth-js';
import { neonConfig } from '@neondatabase/serverless';
import { hash, verify } from 'argon2';
import { Hono } from 'hono';
import { contextStorage, getContext } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import { randomUUID } from 'node:crypto';
import ws from 'ws';
// Prisma-based user store (we use JWT strategy without adapter)
import prisma from '../src/app/api/utils/prisma';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { security } from '../src/server/middlewares/security';
import { isAuthAction } from './is-auth-action';
import { API_BASENAME, api } from './route-builder';
import routes from '../src/server/routes';
import { wsHub } from '../src/server/realtime/ws';
import { scheduleDaily } from '../src/server/cron/scheduler';
import { dailyReminder, autoSuspension } from '../src/server/cron/tasks';
neonConfig.webSocketConstructor = ws;

function normalizeIranPhoneLocal(phone: string): string {
  // Basic normalization to +98xxxxxxxxxx
  return `+98${phone.replace(/^\+98|^0/, '')}`;
}

// Simple in-memory rate limiter for credentials sign-in
const signinBuckets = new Map<string, { count: number; resetAt: number }>();
function shouldThrottleSignin(email: string) {
  const key = `${email}`;
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 10;
  let bucket = signinBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    signinBuckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count > limit;
}

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

// No Auth.js adapter; we authenticate against Prisma.User directly

const app = new Hono();

// Request ID (unique per request)
app.use('*', requestId());

// Security headers (apply once, globally)
app.use('*', security);

app.use('*', (c, next) => {
  // Critical environment validation (fail-fast on missing vars)
  if (!process.env.__ENV_HEALTH_LOGGED) {
    const critical = ['DATABASE_URL', 'AUTH_SECRET'];
    const security = ['ADMIN_SETUP_SECRET', 'DEFAULT_ADVISOR_PASSWORD'];
    const missing = [] as string[];
    const warnings = [] as string[];
    
    for (const k of critical) {
      if (!process.env[k]) missing.push(k);
    }
    for (const k of security) {
      if (!process.env[k]) warnings.push(k);
    }
    
    if (missing.length) {
      console.error(`FATAL: Missing critical environment variables: ${missing.join(', ')}`);
      console.error('Application cannot start. Please check your .env file.');
      process.exit(1);
    }
    if (warnings.length) {
      console.warn(`WARNING: Missing security env vars: ${warnings.join(', ')}`);
      console.warn('Some admin endpoints may not work properly.');
    } else {
      console.log('✓ Environment configuration validated');
    }
    process.env.__ENV_HEALTH_LOGGED = '1';
  }
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

app.use(contextStorage());

// Global error envelope (JSON) for all errors
app.onError((err, c) => {
  const explicitStatus = (err as any)?.status;
  const status = typeof explicitStatus === 'number' && explicitStatus >= 400 && explicitStatus <= 599 ? explicitStatus : 500;
  const reqId = c.get('requestId') || randomUUID();
  const isInternal = status >= 500;
  const body = {
    error: {
      code: isInternal ? 'INTERNAL_ERROR' : (err as any)?.code ?? 'ERROR',
      message: isInternal ? 'Internal server error' : (err as any)?.message ?? 'Error',
      details: null,
    },
    requestId: reqId,
  };
  return c.json(body, status as any);
});

// CORS for API (fixed origin for dev)
app.use(
  '/api/*',
  cors({
    origin: 'http://localhost:4000',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })
);

// Top-level health check under /api
app.get('/api/health', (c) => c.json({ ok: true }, 200));

// Force error endpoint for verification of global error handler
app.get('/api/force_error', () => {
  throw new Error('Forced error');
});

// Initialize auth configuration
if (process.env.AUTH_SECRET) {
  console.log('✓ Initializing auth configuration');
  
  const authConfig: any = {
    secret: process.env.AUTH_SECRET,
    // Ensure Auth.js parses actions at our API route
    basePath: '/api/auth',
    // adapter: PrismaAdapter(prisma), // not used; we keep JWT-only
    pages: {
      signIn: '/account/signin',
      signOut: '/account/logout',
    },
    session: {
      strategy: 'jwt',
      // Require re-login if user was inactive; 30 days expiry
      maxAge: 60 * 60 * 24 * 30,
    },
    callbacks: {
      session({ session, token }) {
        if (token.sub) {
          session.user.id = token.sub;
        }
        if (token.role) {
          session.user.role = token.role;
        }
        if (token.phone) {
          session.user.phone = token.phone;
        }
        return session;
      },
      jwt({ token, user }) {
        if (user) {
          token.role = user.role;
          token.phone = user.phone;
        }
        return token;
      },
    },
    cookies: {
      csrfToken: {
        options: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        },
      },
      sessionToken: {
        options: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        },
      },
      callbackUrl: {
        options: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        },
      },
    },
    providers: [
      Credentials({
        id: 'credentials-signin',
        name: 'Credentials Sign in',
        credentials: {
          email: {
            label: 'Email',
            type: 'email',
          },
          password: {
            label: 'Password',
            type: 'password',
          },
        },
        authorize: async (credentials) => {
          try {
            const { email, password } = credentials as any;
            if (!email || !password) {
              return null;
            }
            if (typeof email !== 'string' || typeof password !== 'string') {
              return null;
            }

            // Throttle login attempts per email
            if (shouldThrottleSignin(email)) {
              return null;
            }

            // Phone-number based login primarily
            const phone = email.includes('@') ? email : email;
            const normalizedPhone = normalizeIranPhoneLocal(phone);
            const dbUser = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
            if (!dbUser) return null;

            const isValid = await verify(dbUser.password, password);
            if (!isValid) {
              return null;
            }

            // Map to Auth.js user shape minimally
            await prisma.user.update({ where: { id: dbUser.id }, data: { lastLogin: new Date(), status: 'ACTIVE' } });
            return { id: dbUser.id, email: `${normalizedPhone}@temp.com`, name: dbUser.name ?? null } as any;
          } catch (error) {
            const err = error as any;
            let serialized = null;
            try { serialized = JSON.stringify(err); } catch { serialized = '[unserializable error]'; }
            try {
              console.error(
                '🔥🔥🔥 AUTH_AUTHORIZE_FAILURE 🔥🔥🔥',
                {
                  message: err?.message,
                  stack: err?.stack,
                  cause: err?.cause,
                  serialized,
                  context: { providerId: 'credentials-signin' }
                }
              );
            } catch {}
            return null;
          }
        },
      }),
      // Sign-up handled by REST API after OTP verify
    ],
  };

  // Only skip CSRF if explicitly allowed for this environment
  if (process.env.SKIP_CSRF === 'true') (authConfig as any).skipCSRFCheck = skipCSRFCheck;

  app.use('*', initAuthConfig(() => authConfig as any));
}
app.all('/integrations/:path{.+}', async (c, next) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-ignore - this key is accepted even if types not aware and is
    // required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

// Handle Auth.js actions explicitly (avoid catching our custom /api/auth/* routes)
app.all('/api/auth/signin', authHandler());
app.all('/api/auth/signout', authHandler());
app.all('/api/auth/session', authHandler());
app.all('/api/auth/csrf', authHandler());
app.all('/api/auth/providers', authHandler());
app.all('/api/auth/callback/:provider', authHandler());

// Mount new typed Hono routes implemented under src/server FIRST
console.log('🔧 [SERVER] Mounting server routes...');
app.route('/api', routes);
console.log('✅ [SERVER] Server routes mounted');

// Handle legacy generated API routes (already include '/api' in their own paths)
console.log('🔧 [SERVER] Mounting route-builder API routes...');
console.log('🔧 [SERVER] API routes count:', api.routes.length);
app.route('/', api);
console.log('✅ [SERVER] Route-builder API routes mounted');

// Fallback NOT_FOUND for any unmatched /api/* route
app.all('/api/*', (c) => {
  const reqId = c.get('requestId') || randomUUID();
  return c.json(
    {
      error: { code: 'NOT_FOUND', message: 'Route not found', details: null },
      requestId: reqId,
    },
    404
  );
});

// Process-level guards to avoid crashes
process.on('unhandledRejection', (reason) => {
  console.error('UnhandledRejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('UncaughtException:', error);
});

// Create server lazily without top-level await; export an object with fetch()
const serverPromise = createHonoServer({
  app,
  defaultLogger: false,
});

serverPromise
  .then((created) => {
    try { wsHub.attach(created as any); } catch (err) { console.warn('WS attach failed', err); }
    try {
      scheduleDaily('23:00', dailyReminder);
      scheduleDaily('02:00', autoSuspension);
    } catch (err) { console.warn('Cron schedule init failed', err); }
  })
  .catch((err) => {
    console.error('[server bootstrap] failed:', err);
  });

const lazyHonoApp = {
  fetch: async (request: Request, env?: any, ctx?: any) => {
    const created = await serverPromise;
    // created is a Hono app instance; delegate fetch
    return created.fetch(request as any, env as any, ctx as any);
  },
};

export default lazyHonoApp as any;
