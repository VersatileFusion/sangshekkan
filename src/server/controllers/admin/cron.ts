import { Hono } from 'hono';
import { dailyReminder, autoSuspension } from '@/server/cron/tasks';

export const adminCronController = new Hono();

adminCronController.get('/run', async (c) => {
  const task = c.req.query('task');
  if (task === 'dailyReminder') {
    await dailyReminder();
    return c.json({ ran: task }, 200);
  }
  if (task === 'autoSuspension') {
    await autoSuspension();
    return c.json({ ran: task }, 200);
  }
  return c.json({ error: 'Unknown task' }, 400);
});

export default adminCronController;



