import sql from "@/app/api/utils/sql";
import { hash as argonHash } from "argon2";
import { requireAdminSecret } from "@/app/api/utils/auth";

export async function POST(request) {
  try {
    const check = await requireAdminSecret(request);
    if (check.error) return check.error;

    const password = process.env.DEFAULT_ADVISOR_PASSWORD || "change-me-now";
    const passwordHash = await argonHash(password);

    // Update advisor password
    await sql`
      UPDATE auth_accounts 
      SET password = ${passwordHash}
      WHERE "userId" = 2 AND provider = 'credentials'
    `;

    // Verify the update
    const result = await sql`
      SELECT 
        au.email,
        au.name,
        u.role,
        LENGTH(aa.password) as hash_length,
        SUBSTRING(aa.password, 1, 16) || '...' as hash_preview
      FROM auth_users au
      JOIN users u ON au.id = u.auth_user_id  
      JOIN auth_accounts aa ON au.id = aa."userId"
      WHERE au.email = 'melika.sangshakan@advisor.com'
    `;

    return Response.json({
      success: true,
      message: 'Advisor password updated successfully!'
    });

  } catch (error) {
    console.error('Fix password error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}