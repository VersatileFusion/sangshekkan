import { Hono } from 'hono';
import prisma from '@/app/api/utils/prisma';

export const statsController = new Hono();

statsController.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const [approved, rejected, pending] = await Promise.all([
    prisma.report.count({ where: { studentId: userId, status: 'APPROVED' } }),
    prisma.report.count({ where: { studentId: userId, status: 'REJECTED' } }),
    prisma.report.count({ where: { studentId: userId, status: 'PENDING' } }),
  ]);
  return c.json({ approved, rejected, pending }, 200);
});

export default statsController;




