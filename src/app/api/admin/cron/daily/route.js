import prisma from "@/app/api/utils/prisma";

// This endpoint can be triggered by an external scheduler (e.g., Windows Task Scheduler or a hosted cron)
// It runs daily tasks, including suspending inactive verified users for 30+ days.

export async function POST() {
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const suspend = await tx.user.updateMany({
        where: {
          isVerified: true,
          OR: [
            { lastLogin: { lt: cutoff } },
            { lastLogin: null },
          ],
          status: 'ACTIVE',
        },
        data: {
          status: 'SUSPENDED',
          accessSuspendedAt: new Date(),
        },
      });

      return { suspendedCount: suspend.count };
    });

    return Response.json(result);
  } catch (error) {
    console.error('daily cron error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}






