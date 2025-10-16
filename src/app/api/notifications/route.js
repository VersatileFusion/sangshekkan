import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

// Get notifications for current user
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const unreadOnly = url.searchParams.get('unread_only') === 'true';

    // Get user from database
    const user = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (user.length === 0) {
      return Response.json({ notifications: [] });
    }

    const userId = user[0].id;

    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;

    if (unreadOnly) {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const notifications = await sql(query, params);

    // Get unread count
    const unreadCount = await sql`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ${userId} AND is_read = false
    `;

    return Response.json({ 
      notifications,
      unread_count: parseInt(unreadCount[0].count)
    });
  } catch (error) {
    console.error("Error in GET /api/notifications:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Mark notifications as read
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, mark_all_read } = body;

    // Get user from database
    const user = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (user.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user[0].id;

    if (mark_all_read) {
      // Mark all notifications as read
      await sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = ${userId} AND is_read = false
      `;
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      if (notification_ids.length > 0) {
        const placeholders = notification_ids.map((_, index) => `$${index + 2}`).join(',');
        const query = `
          UPDATE notifications 
          SET is_read = true 
          WHERE user_id = $1 AND id IN (${placeholders})
        `;
        await sql(query, [userId, ...notification_ids]);
      }
    }

    return Response.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error in POST /api/notifications:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}