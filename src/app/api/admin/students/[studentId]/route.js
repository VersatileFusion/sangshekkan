import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

/**
 * GET /api/admin/students/[studentId] - دریافت اطلاعات کامل یک دانش‌آموز همراه با گزارش‌ها
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { studentId } = params;

    if (!studentId) {
      return Response.json({ error: "ID دانش‌آموز الزامی است" }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findFirst({
      where: { phone: session.user.phone },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Only admins can view student profiles
    if (currentUser.role !== "ADMIN") {
      return Response.json({ error: "فقط مدیر می‌تواند پروفایل دانش‌آموز را مشاهده کند" }, { status: 403 });
    }

    // Get student details
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        grade: true,
        field: true,
        city: true,
        profileImageUrl: true,
        phoneVerifiedAt: true,
        isVerified: true,
        status: true,
        lastLogin: true,
        createdAt: true
      }
    });

    if (!student) {
      return Response.json({ error: "دانش‌آموز یافت نشد" }, { status: 404 });
    }

    // Get student reports (schema-aligned)
    const reports = await prisma.report.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        date: true,
        subject: true,
        testSource: true,
        testCount: true,
        studyDurationMinutes: true,
        description: true,
        fileUrl: true,
        status: true,
        createdAt: true,
        // One-to-one feedback
        feedback: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            admin: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    console.log(`✅ [GET /api/admin/students/${studentId}] Fetched student profile with ${reports.length} reports`);

    return Response.json({
      success: true,
      student,
      reports,
      reportsCount: reports.length
    });

  } catch (error) {
    console.error(`❌ [GET /api/admin/students] Error:`, error);
    return Response.json({
      success: false,
      error: "خطای سرور در دریافت اطلاعات دانش‌آموز"
    }, { status: 500 });
  }
}


