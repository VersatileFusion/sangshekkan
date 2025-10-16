import { Hono } from 'hono';
import prisma from '@/app/api/utils/prisma';

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const FAMILY_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours
const FAMILY_LIMIT = 2;

function getSettingBoolean(value: string | null | undefined, fallback = true) {
  if (value == null) return fallback;
  const v = value.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export const messagesController = new Hono();

messagesController.post('/', async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json().catch(() => ({}));
  const content = String(body?.content ?? '').trim();
  const panelType = String(body?.panelType ?? '');
  if (!content || (panelType !== 'TOP_STUDENTS' && panelType !== 'FAMILY_CHAT')) {
    const err = new Error('Invalid body');
    ;(err as any).status = 400; (err as any).code = 'BAD_REQUEST';
    throw err;
  }

  if (panelType === 'FAMILY_CHAT') {
    const key = `family:${userId}`;
    const now = Date.now();
    let b = rateBuckets.get(key);
    if (!b || now > b.resetAt) { b = { count: 0, resetAt: now + FAMILY_WINDOW_MS }; rateBuckets.set(key, b); }
    if (b.count >= FAMILY_LIMIT) { const e = new Error('Rate limited'); (e as any).status = 429; (e as any).code='RATE_LIMITED'; throw e; }
    b.count += 1;
    // Check global toggle
    const setting = await prisma.appSetting.findUnique({ where: { key: 'FAMILY_CHAT_ENABLED' } });
    const enabled = getSettingBoolean(setting?.value ?? 'true', true);
    if (!enabled) { const e = new Error('Family chat disabled'); (e as any).status = 403; (e as any).code='DISABLED'; throw e; }
  }

  const created = await prisma.message.create({ data: { content, panelType, senderId: userId } });
  return c.json(created, 201);
});

messagesController.get('/', async (c) => {
  const panel = c.req.query('panel');
  const includeUnapproved = c.req.query('include') === 'unapproved';
  if (panel !== 'top' && panel !== 'family') {
    const err = new Error('Invalid panel'); (err as any).status = 400; (err as any).code='BAD_REQUEST'; throw err;
  }
  const where: any = { panelType: panel === 'top' ? 'TOP_STUDENTS' : 'FAMILY_CHAT' };
  const userId = c.get('userId') as string | undefined;
  // Only admins can request unapproved
  if (!includeUnapproved) where.isApproved = true;
  const items = await prisma.message.findMany({ where, orderBy: { createdAt: 'asc' }, take: 200 });
  return c.json(items, 200);
});

export default messagesController;


