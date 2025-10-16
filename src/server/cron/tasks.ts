import prisma from '@/app/api/utils/prisma';

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export async function dailyReminder() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const students = await prisma.user.findMany({ where: { role: 'STUDENT', status: 'ACTIVE' }, select: { id: true } });
  const reported = await prisma.report.findMany({ where: { date: { gte: start, lt: end } }, select: { studentId: true } });
  const reportedSet = new Set(reported.map((r) => r.studentId));
  const targets = students.filter((s) => !reportedSet.has(s.id));

  if (targets.length === 0) return;
  await prisma.notification.createMany({
    data: targets.map((t) => ({ recipientId: t.id, content: 'یادآوری: گزارش مطالعه امروز را ثبت کنید', type: 'REMINDER' })),
    skipDuplicates: true,
  });
}

export async function autoSuspension() {
  const suspendDays = envInt('SUSPEND_DURATION_DAYS', 7);
  const now = new Date();
  const reenableBefore = new Date(now.getTime() - suspendDays * 24 * 60 * 60 * 1000);

  // 1) Re-enable users with accessSuspendedAt older than threshold
  await prisma.user.updateMany({
    where: { accessSuspendedAt: { lt: reenableBefore } },
    data: { accessSuspendedAt: null, status: 'ACTIVE' },
  });

  // 2) 30-day rule: any pending report older than 30 days => suspend
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const pending = await prisma.report.findMany({ where: { status: 'PENDING', createdAt: { lt: thirtyDaysAgo } }, select: { studentId: true } });
  const ids = Array.from(new Set(pending.map((p) => p.studentId)));
  if (ids.length) {
    await prisma.user.updateMany({ where: { id: { in: ids } }, data: { status: 'SUSPENDED', accessSuspendedAt: now } });
  }
}



