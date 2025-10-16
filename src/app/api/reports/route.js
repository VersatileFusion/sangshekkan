import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

// Create a new study report
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, subject, test_source, test_count, study_duration, ghalamchi_score } = body;

    // Validation
    if (!date || !subject || !test_source || test_count === undefined || study_duration === undefined) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (test_count < 0 || study_duration < 0) {
      return Response.json({ error: "Test count and study duration must be non-negative" }, { status: 400 });
    }

    if (ghalamchi_score !== undefined && ghalamchi_score < 0) {
      return Response.json({ error: "Ghalamchi score must be non-negative" }, { status: 400 });
    }

    // Get user from database
    const user = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (user.length === 0) {
      return Response.json({ error: "User profile not found" }, { status: 404 });
    }

    const userId = user[0].id;

    try {
      // Insert report (will fail if duplicate date exists)
      const newReport = await sql`
        INSERT INTO study_reports (user_id, date, subject, test_source, test_count, study_duration, ghalamchi_score)
        VALUES (${userId}, ${date}, ${subject}, ${test_source}, ${test_count}, ${study_duration}, ${ghalamchi_score || null})
        RETURNING *
      `;

      return Response.json({ report: newReport[0] });
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return Response.json({ error: "Report for this date already exists" }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in POST /api/reports:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get study reports for current user
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // Get user from database
    const user = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (user.length === 0) {
      return Response.json({ reports: [] });
    }

    const userId = user[0].id;

    let query = `
      SELECT r.*, f.feedback_text, f.created_at as feedback_date
      FROM study_reports r
      LEFT JOIN feedback f ON r.id = f.report_id
      WHERE r.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND r.date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND r.date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY r.date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const reports = await sql(query, params);

    return Response.json({ reports });
  } catch (error) {
    console.error("Error in GET /api/reports:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}