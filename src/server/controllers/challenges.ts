import { Hono } from 'hono';
import prisma from '@/app/api/utils/prisma';

export const challengesController = new Hono();

// GET /api/challenges/active
challengesController.get('/active', async (c) => {
  const now = new Date();
  const items = await prisma.challenge.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { startDate: 'asc' },
  });
  return c.json(items, 200);
});

// POST /api/challenges/:challengeId/participate
challengesController.post('/:challengeId/participate', async (c) => {
  const studentId = c.get('userId') as string;
  const challengeId = c.req.param('challengeId');
  const today = new Date();
  const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const participation = await prisma.challengeParticipation.upsert({
    where: { studentId_challengeId_date: { studentId, challengeId, date: dateOnly } },
    update: {},
    create: { studentId, challengeId, date: dateOnly },
  });
  return c.json(participation, 200);
});

// GET /api/challenges/leaderboard
challengesController.get('/leaderboard', async (c) => {
  const agg = await prisma.challengeParticipation.groupBy({
    by: ['studentId'],
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } },
    take: 100,
  });
  const ids = agg.map((a) => a.studentId);
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, profileImageUrl: true } });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const rows = agg.map((a, i) => ({ rank: i + 1, count: a._count._all, student: userMap.get(a.studentId) }));
  return c.json(rows, 200);
});

export default challengesController;



