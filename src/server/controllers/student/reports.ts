import { Hono } from 'hono';
import { z } from 'zod';
import prisma from '@/app/api/utils/prisma';
import { getPublicUrl } from '../../services/storage/s3';

const createSchema = z.object({
  date: z.string().or(z.date()),
  testCount: z.number().int().nonnegative(),
  studyHours: z.number().nonnegative().optional(),
  studyDurationMinutes: z.number().int().nonnegative().optional(),
  subject: z.string().optional(),
  testSource: z.string().optional(),
  notes: z.string().optional(),
  fileKey: z.string().optional(), // برای R2 upload
  fileUrl: z.string().optional(), // برای local upload
});

const periodSchema = z.enum(['weekly', 'monthly', 'all']).default('all');

export const reportsController = new Hono();

reportsController.post('/', async (c) => {
  const userId = c.get('userId') as string;
  const json = await c.req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    const err = new Error('Invalid body');
    ;(err as any).status = 400;
    ;(err as any).code = 'BAD_REQUEST';
    throw err;
  }
  const data = parsed.data as any;
  const date = new Date(data.date);
  const studyDurationMinutes = typeof data.studyDurationMinutes === 'number'
    ? data.studyDurationMinutes
    : typeof data.studyHours === 'number' ? Math.round(data.studyHours * 60) : 0;
  
  // ✅ محدودیت 3 گزارش در روز
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const reportsCountToday = await prisma.report.count({
    where: {
      studentId: userId,
      createdAt: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
  });

  if (reportsCountToday >= 3) {
    console.log(`⛔ [Reports] User ${userId} exceeded daily limit: ${reportsCountToday}/3`);
    const err = new Error('شما به حداکثر تعداد گزارش مجاز در روز (۳ گزارش) رسیده‌اید. لطفاً فردا مجدداً تلاش کنید.');
    ;(err as any).status = 429; // Too Many Requests
    ;(err as any).code = 'RATE_LIMIT_EXCEEDED';
    throw err;
  }

  console.log(`✅ [Reports] User ${userId} can create report: ${reportsCountToday}/3 today`);
  
  // پشتیبانی از هر دو روش: fileKey (R2) و fileUrl مستقیم (Local)
  let fileUrl = undefined;
  if (data.fileUrl) {
    // اگر fileUrl مستقیماً ارسال شده (آپلود محلی)
    fileUrl = data.fileUrl;
  } else if (data.fileKey) {
    // اگر fileKey ارسال شده (آپلود R2)
    try {
      fileUrl = getPublicUrl(data.fileKey);
    } catch (error) {
      console.error('Error getting public URL for fileKey:', error);
      fileUrl = undefined;
    }
  }

  const created = await prisma.report.create({
    data: {
      date,
      subject: data.subject ?? 'مطالعه',
      testSource: data.testSource ?? 'عمومی',
      testCount: data.testCount,
      studyDurationMinutes,
      description: data.notes ?? null,
      fileUrl: fileUrl ?? null,
      studentId: userId,
    },
  });
  return c.json(created, 201);
});

reportsController.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const period = periodSchema.parse(c.req.query('period') ?? 'all');
  const now = new Date();
  let from: Date | undefined;
  if (period === 'weekly') {
    from = new Date(now);
    from.setDate(now.getDate() - 7);
  } else if (period === 'monthly') {
    from = new Date(now);
    from.setMonth(now.getMonth() - 1);
  }

  const reports = await prisma.report.findMany({
    where: {
      studentId: userId,
      ...(from ? { date: { gte: from, lte: now } } : {}),
    },
    include: { feedback: true },
    orderBy: { date: 'desc' },
  });
  return c.json(reports, 200);
});

export default reportsController;




