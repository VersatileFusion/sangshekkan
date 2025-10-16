import { Hono } from 'hono';
import prisma from '@/app/api/utils/prisma';

export const adminSettingsController = new Hono();

adminSettingsController.post('/toggle-family-chat', async (c) => {
  const current = await prisma.appSetting.findUnique({ where: { key: 'FAMILY_CHAT_ENABLED' } });
  const now = (current?.value ?? 'true').toLowerCase();
  const next = now === 'true' || now === '1' || now === 'yes' || now === 'on' ? 'false' : 'true';
  const saved = await prisma.appSetting.upsert({
    where: { key: 'FAMILY_CHAT_ENABLED' },
    update: { value: next },
    create: { key: 'FAMILY_CHAT_ENABLED', value: next },
  });
  return c.json(saved, 200);
});

export default adminSettingsController;



