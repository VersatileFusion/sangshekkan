import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const challengeId = params.id;

    // Get user info
    const userQuery = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (userQuery.length === 0) {
      return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // Get challenge with stats
    const challengeQuery = await sql`
      SELECT 
        c.*,
        u.name as creator_name,
        COUNT(DISTINCT cp.user_id) as total_participants,
        COUNT(DISTINCT CASE WHEN cp.completed = true THEN cp.user_id END) as successful_participants
      FROM challenges c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN challenge_participations cp ON c.id = cp.challenge_id
      WHERE c.id = ${challengeId}
      GROUP BY c.id, u.name
    `;

    if (challengeQuery.length === 0) {
      return Response.json({ error: 'چالش یافت نشد' }, { status: 404 });
    }

    return Response.json({ challenge: challengeQuery[0] });

  } catch (error) {
    console.error('Get challenge error:', error);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const challengeId = params.id;
    const { title, description, start_date, end_date, is_active } = await request.json();

    // Get user info
    const userQuery = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (userQuery.length === 0) {
      return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const currentUser = userQuery[0];
    const isAdvisor = currentUser.role === 'advisor' || session.user.email === 'melika.sangshakan@advisor.com';

    if (!isAdvisor) {
      return Response.json({ error: 'فقط مشاور می‌تواند چالش ویرایش کند' }, { status: 403 });
    }

    // Check if challenge exists
    const existingChallenge = await sql`
      SELECT * FROM challenges WHERE id = ${challengeId}
    `;

    if (existingChallenge.length === 0) {
      return Response.json({ error: 'چالش یافت نشد' }, { status: 404 });
    }

    // Update challenge
    const updatedChallenge = await sql`
      UPDATE challenges SET
        title = ${title || existingChallenge[0].title},
        description = ${description !== undefined ? description : existingChallenge[0].description},
        start_date = ${start_date || existingChallenge[0].start_date},
        end_date = ${end_date || existingChallenge[0].end_date},
        is_active = ${is_active !== undefined ? is_active : existingChallenge[0].is_active},
        updated_at = NOW()
      WHERE id = ${challengeId}
      RETURNING *
    `;

    return Response.json({ 
      message: 'چالش با موفقیت به‌روزرسانی شد',
      challenge: updatedChallenge[0]
    });

  } catch (error) {
    console.error('Update challenge error:', error);
    return Response.json({ error: 'خطای سرور در به‌روزرسانی چالش' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const challengeId = params.id;

    // Get user info
    const userQuery = await sql`
      SELECT * FROM users WHERE auth_user_id = ${session.user.id}
    `;

    if (userQuery.length === 0) {
      return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const currentUser = userQuery[0];
    const isAdvisor = currentUser.role === 'advisor' || session.user.email === 'melika.sangshakan@advisor.com';

    if (!isAdvisor) {
      return Response.json({ error: 'فقط مشاور می‌تواند چالش حذف کند' }, { status: 403 });
    }

    // Check if challenge exists
    const existingChallenge = await sql`
      SELECT * FROM challenges WHERE id = ${challengeId}
    `;

    if (existingChallenge.length === 0) {
      return Response.json({ error: 'چالش یافت نشد' }, { status: 404 });
    }

    // Delete challenge (this will also delete participations due to CASCADE)
    await sql`
      DELETE FROM challenges WHERE id = ${challengeId}
    `;

    return Response.json({ message: 'چالش با موفقیت حذف شد' });

  } catch (error) {
    console.error('Delete challenge error:', error);
    return Response.json({ error: 'خطای سرور در حذف چالش' }, { status: 500 });
  }
}