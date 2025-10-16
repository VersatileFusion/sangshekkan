import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

// Update milestone
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Get user
    const user = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (user.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user[0].id;

    // Check if milestone belongs to user
    const milestone = await sql`
      SELECT * FROM milestones WHERE id = ${id} AND user_id = ${userId}
    `;

    if (milestone.length === 0) {
      return Response.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (body.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      updateValues.push(body.title);
      paramIndex++;
    }

    if (body.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(body.description);
      paramIndex++;
    }

    if (body.target_date !== undefined) {
      updateFields.push(`target_date = $${paramIndex}`);
      updateValues.push(body.target_date);
      paramIndex++;
    }

    if (body.target_tests !== undefined) {
      updateFields.push(`target_tests = $${paramIndex}`);
      updateValues.push(body.target_tests);
      paramIndex++;
    }

    if (body.target_hours !== undefined) {
      updateFields.push(`target_hours = $${paramIndex}`);
      updateValues.push(body.target_hours);
      paramIndex++;
    }

    if (body.subjects !== undefined) {
      updateFields.push(`subjects = $${paramIndex}`);
      updateValues.push(body.subjects);
      paramIndex++;
    }

    if (body.priority !== undefined) {
      updateFields.push(`priority = $${paramIndex}`);
      updateValues.push(body.priority);
      paramIndex++;
    }

    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(body.status);
      paramIndex++;
    }

    if (body.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      updateValues.push(body.notes);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add WHERE clause parameters
    updateFields.push(`WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`);
    updateValues.push(id, userId);

    const query = `UPDATE milestones SET ${updateFields.join(', ')} RETURNING *`;
    const updatedMilestone = await sql(query, updateValues);

    return Response.json({ milestone: updatedMilestone[0] });
  } catch (error) {
    console.error("Error in PUT /api/milestones/[id]:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete milestone
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Get user
    const user = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (user.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user[0].id;

    // Delete milestone (only if it belongs to the user)
    const deletedMilestone = await sql`
      DELETE FROM milestones 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;

    if (deletedMilestone.length === 0) {
      return Response.json({ error: "Milestone not found" }, { status: 404 });
    }

    return Response.json({ message: "Milestone deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/milestones/[id]:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}