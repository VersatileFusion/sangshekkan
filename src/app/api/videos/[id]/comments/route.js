import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const videoId = params.id;

    // Get user info
    const userQuery = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (userQuery.length === 0) {
      return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const currentUser = userQuery[0];
    const isAdvisor = currentUser.role === 'advisor' || session.user.email === 'melika.sangshakan@advisor.com';

    // Get comments (approved ones for students, all for advisor)
    let commentsQuery = `
      SELECT 
        vc.*,
        u.name as user_name,
        u.profile_image_url
      FROM video_comments vc
      LEFT JOIN users u ON vc.user_id = u.id
      WHERE vc.video_id = $1
    `;

    if (!isAdvisor) {
      commentsQuery += ` AND vc.is_approved = true`;
    }

    commentsQuery += ` ORDER BY vc.created_at DESC`;

    const comments = await sql(commentsQuery, [videoId]);

    return Response.json({ comments });

  } catch (error) {
    console.error('Get comments error:', error);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const videoId = params.id;
    const { comment } = await request.json();

    if (!comment || comment.trim().length === 0) {
      return Response.json({ error: 'نظر نمی‌تواند خالی باشد' }, { status: 400 });
    }

    if (comment.trim().length > 500) {
      return Response.json({ error: 'نظر بیش از حد طولانی است' }, { status: 400 });
    }

    // Get user info
    const userQuery = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (userQuery.length === 0) {
      return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const currentUser = userQuery[0];

    // Check if video exists
    const videoQuery = await sql`
      SELECT * FROM videos WHERE id = ${videoId} AND is_approved = true
    `;

    if (videoQuery.length === 0) {
      return Response.json({ error: 'ویدیو یافت نشد' }, { status: 404 });
    }

    // Create comment (needs approval)
    const newComment = await sql`
      INSERT INTO video_comments (video_id, user_id, comment, is_approved)
      VALUES (${videoId}, ${currentUser.id}, ${comment.trim()}, false)
      RETURNING *
    `;

    // Notify advisor about new comment
    try {
      const advisorQuery = await sql`
        SELECT id FROM users WHERE role = 'advisor' OR email = 'melika.sangshakan@advisor.com' LIMIT 1
      `;

      if (advisorQuery.length > 0) {
        await sql`
          INSERT INTO notifications (user_id, title, message, type, related_id)
          VALUES (
            ${advisorQuery[0].id},
            'نظر جدید',
            ${`${currentUser.name} نظر جدیدی برای ویدیو "${videoQuery[0].title}" نوشته است`},
            'new_comment',
            ${newComment[0].id}
          )
        `;
      }
    } catch (error) {
      console.error('Failed to send comment notification:', error);
    }

    return Response.json({ 
      message: 'نظر شما پس از تایید مشاور نمایش داده خواهد شد',
      comment: newComment[0]
    });

  } catch (error) {
    console.error('Add comment error:', error);
    return Response.json({ error: 'خطای سرور در ثبت نظر' }, { status: 500 });
  }
}