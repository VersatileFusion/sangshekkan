import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

// Get user's milestones
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user profile
    let user = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (user.length === 0) {
      user = await sql`
        INSERT INTO users (auth_user_id, name, email)
        VALUES (${session.user.id}, ${session.user.name}, ${session.user.email})
        RETURNING *
      `;
    }

    const userId = user[0].id;

    // Get milestones
    const milestones = await sql`
      SELECT * FROM milestones 
      WHERE user_id = ${userId}
      ORDER BY target_date ASC
    `;

    return Response.json({ milestones });
  } catch (error) {
    console.error("Error in GET /api/milestones:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create new milestone
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      target_date, 
      target_tests, 
      target_hours, 
      subjects, 
      priority 
    } = body;

    if (!title || !target_date || !target_tests) {
      return Response.json({ error: "عنوان، تاریخ هدف و تعداد تست اجباری است" }, { status: 400 });
    }

    // Get or create user profile
    let user = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (user.length === 0) {
      user = await sql`
        INSERT INTO users (auth_user_id, name, email)
        VALUES (${session.user.id}, ${session.user.name}, ${session.user.email})
        RETURNING *
      `;
    }

    const userId = user[0].id;

    // Insert new milestone
    const newMilestone = await sql`
      INSERT INTO milestones (
        user_id, title, description, target_date, target_tests, 
        target_hours, subjects, priority, status
      )
      VALUES (
        ${userId}, ${title}, ${description || null}, ${target_date}, ${target_tests},
        ${target_hours || null}, ${subjects || null}, ${priority || 'medium'}, 'pending'
      )
      RETURNING *
    `;

    return Response.json({ milestone: newMilestone[0] });
  } catch (error) {
    console.error("Error in POST /api/milestones:", error);
    return Response.json({ error: "خطا در ثبت هدف" }, { status: 500 });
  }
}