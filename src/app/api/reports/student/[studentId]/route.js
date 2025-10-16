import { auth } from "@/auth";
import prisma from "@/app/api/utils/prisma";

/**
 * GET /api/reports/student/:studentId
 * Fetch all reports for a specific student (Admin only)
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد حساب کاربری خود شوید" }, { status: 401 });
    }

    // Get current user and verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone },
      select: { id: true, role: true }
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return Response.json({ error: "شما دسترسی لازم برای این عملیات را ندارید" }, { status: 403 });
    }

    const { studentId } = params;

    if (!studentId) {
      return Response.json({ error: "شناسه دانش‌آموز الزامی است" }, { status: 400 });
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true }
    });

    if (!student) {
      return Response.json({ error: "دانش‌آموز یافت نشد" }, { status: 404 });
    }

    // Fetch all reports for this student with feedback
    const reports = await prisma.report.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        feedback: {
          include: {
            admin: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ [GET /api/reports/student/${studentId}] Fetched ${reports.length} reports`);

    return Response.json({
      success: true,
      reports,
      total: reports.length
    });

  } catch (error) {
    console.error("❌ [GET /api/reports/student/:studentId] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور در دریافت گزارش‌ها"
    }, { status: 500 });
  }
}

