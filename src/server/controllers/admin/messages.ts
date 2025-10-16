import { Hono } from 'hono';
import prisma from '@/app/api/utils/prisma';
import { wsHub } from '@/server/realtime/ws';

export const adminMessagesController = new Hono();

// Approve a pending message and return it
adminMessagesController.post('/:messageId/approve', async (c) => {
  const id = c.req.param('messageId');
  const existing = await prisma.message.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Message not found');
    ;(err as any).status = 404; (err as any).code = 'NOT_FOUND';
    throw err;
  }
  const updated = await prisma.message.update({ where: { id }, data: { isApproved: true } });
  if (updated.panelType === 'TOP_STUDENTS') {
    try { wsHub.broadcastPanel('TOP_STUDENTS', { kind: 'chat', message: updated }); } catch {}
  }
  return c.json(updated, 200);
});

export default adminMessagesController;


