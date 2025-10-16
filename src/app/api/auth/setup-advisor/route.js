import sql from "@/app/api/utils/sql";
import { hash as argonHash } from "argon2";
import { requireAdminSecret } from "@/app/api/utils/auth";

export async function POST(request) {
  try {
    const check = await requireAdminSecret(request);
    if (check.error) return check.error;

    const advisorPassword = process.env.DEFAULT_ADVISOR_PASSWORD || "change-me-now";
    const passwordHash = await argonHash(advisorPassword);

    // Update advisor account with new password
    await sql`
      UPDATE auth_accounts 
      SET password = ${passwordHash}
      WHERE "userId" = 2 AND provider = 'credentials'
    `;

    // Verify update
    const updatedAccount = await sql`
      SELECT au.name, au.email, u.role 
      FROM auth_users au
      JOIN users u ON au.id = u.auth_user_id
      WHERE au.email = 'melika.sangshakan@advisor.com'
    `;

    return Response.json({ 
      success: true,
      message: 'Advisor password set successfully!',
      account: updatedAccount[0]
    });

  } catch (error) {
    console.error('Setup advisor error:', error);
    return Response.json({ 
      error: 'خطا در تنظیم حساب مشاور',
      details: error.message 
    }, { status: 500 });
  }
}