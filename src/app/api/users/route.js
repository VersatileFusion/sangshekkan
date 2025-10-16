import prisma from "@/app/api/utils/prisma";
import { auth } from "@/auth";

/**
 * GET /api/users - دریافت لیست کاربران با فیلتر
 * Query params: role=ADMIN|STUDENT, limit=10
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where = {};
    
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      take: limit,
      select: {
        id: true,
        name: true,
        role: true,
        profileImageUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return Response.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    console.error("❌ [GET /api/users] Error:", error);
    return Response.json({
      success: false,
      error: "خطای سرور"
    }, { status: 500 });
  }
}
