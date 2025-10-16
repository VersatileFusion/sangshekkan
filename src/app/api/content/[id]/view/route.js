import prisma from "@/app/api/utils/prisma";

/**
 * POST /api/content/[id]/view - افزایش شمارنده بازدید
 */
export async function POST(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return Response.json({ error: "ID محتوا الزامی است" }, { status: 400 });
    }

    // Check if content exists
    const content = await prisma.adminContent.findUnique({
      where: { id }
    });

    if (!content) {
      return Response.json({ error: "محتوا یافت نشد" }, { status: 404 });
    }

    // Increment views
    const updatedContent = await prisma.adminContent.update({
      where: { id },
      data: {
        views: {
          increment: 1
        }
      },
      select: {
        views: true
      }
    });

    console.log(`👁️ [POST /api/content/${id}/view] View count: ${updatedContent.views}`);

    return Response.json({
      success: true,
      views: updatedContent.views
    });

  } catch (error) {
    console.error(`❌ [POST /api/content/view] Error:`, error);
    return Response.json({
      success: false,
      error: "خطای سرور"
    }, { status: 500 });
  }
}


