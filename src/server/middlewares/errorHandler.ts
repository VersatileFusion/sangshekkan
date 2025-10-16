import type { Context, Next } from 'hono';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err: any) {
    const status = typeof err?.status === 'number' ? err.status : 500;
    const code = err?.code ?? (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
    const requestId = c.get('requestId');
    const body = {
      error: {
        code,
        message: err?.message ?? 'Internal server error',
        details: err?.details ?? null,
      },
      requestId,
    };
    c.status(status);
    return c.json(body);
  }
}






