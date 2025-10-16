import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

// Get all reports for advisor review
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is advisor
    const user = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id} AND role = 'advisor'
    `;

    if (user.length === 0) {
      return Response.json(
        { error: "Access denied - advisor only" },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const offset = parseInt(url.searchParams.get("offset")) || 0;
    const status = url.searchParams.get("status");
    const studentId = url.searchParams.get("student_id");
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");

    let query = `
      SELECT 
        r.*,
        u.name as student_name,
        u.email as student_email,
        u.student_grade,
        f.feedback_text,
        f.created_at as feedback_date
      FROM daily_reports r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN feedback f ON r.id = f.report_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Enforce RBAC: only reports for students assigned to this advisor
    // Assumes there is a users.assigned_advisor_id field pointing to advisor's users.id
    query += ` AND u.assigned_advisor_id = $${paramIndex}`;
    params.push(user[0].id);
    paramIndex++;

    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (studentId) {
      query += ` AND r.user_id = $${paramIndex}`;
      params.push(studentId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND r.report_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND r.report_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const reports = await sql(query, params);

    return Response.json({ reports });
  } catch (error) {
    console.error("Error in GET /api/advisor/reports:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Approve/reject report and add feedback
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is advisor
    const advisor = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id} AND role = 'advisor'
    `;

    if (advisor.length === 0) {
      return Response.json(
        { error: "Access denied - advisor only" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { report_id, status, feedback_text } = body;

    if (!report_id || !status) {
      return Response.json(
        { error: "Report ID and status are required" },
        { status: 400 },
      );
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update report status
    const isApproved = status === "approved";
    const updatedReport = await sql`
      UPDATE daily_reports 
      SET status = ${status}, is_approved = ${isApproved}
      WHERE id = ${report_id}
      RETURNING *
    `;

    if (updatedReport.length === 0) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }

    // Add feedback if provided
    if (feedback_text && feedback_text.trim()) {
      // Check if feedback already exists
      const existingFeedback = await sql`
        SELECT * FROM feedback WHERE report_id = ${report_id}
      `;

      if (existingFeedback.length > 0) {
        // Update existing feedback
        await sql`
          UPDATE feedback 
          SET feedback_text = ${feedback_text.trim()}, advisor_id = ${advisor[0].id}
          WHERE report_id = ${report_id}
        `;
      } else {
        // Create new feedback
        await sql`
          INSERT INTO feedback (report_id, advisor_id, feedback_text)
          VALUES (${report_id}, ${advisor[0].id}, ${feedback_text.trim()})
        `;
      }

      // Create notification for student
      const report = updatedReport[0];
      await sql`
        INSERT INTO notifications (user_id, title, message, type, related_id)
        VALUES (
          ${report.user_id}, 
          'بازخورد جدید از مشاور',
          'خانم سنگ‌شکن برای گزارش شما بازخورد نوشته است',
          'feedback',
          ${report_id}
        )
      `;
    }

    // Create notification for status change
    const statusMessages = {
      approved: "گزارش شما تایید شد",
      rejected: "گزارش شما نیاز به بازنگری دارد",
      pending: "گزارش شما در انتظار بررسی است",
    };

    await sql`
      INSERT INTO notifications (user_id, title, message, type, related_id)
      VALUES (
        ${updatedReport[0].user_id}, 
        'وضعیت گزارش تغییر کرد',
        ${statusMessages[status]},
        'status_change',
        ${report_id}
      )
    `;

    return Response.json({
      message: "Report updated successfully",
      report: updatedReport[0],
    });
  } catch (error) {
    console.error("Error in POST /api/advisor/reports:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
