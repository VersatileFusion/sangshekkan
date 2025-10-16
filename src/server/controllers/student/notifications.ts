import { Hono } from 'hono';
import prisma from '@/app/api/utils/prisma';

export const notificationsController = new Hono();

notificationsController.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const items = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return c.json(items, 200);
});

notificationsController.post('/read', async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  if (ids.length === 0) return c.json({ updated: 0 }, 200);
  const res = await prisma.notification.updateMany({ where: { id: { in: ids }, recipientId: userId }, data: { readAt: new Date() } });
  return c.json({ updated: res.count }, 200);
});

export default notificationsController;


