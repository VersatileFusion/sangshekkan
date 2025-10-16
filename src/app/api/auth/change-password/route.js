import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { hash as argonHash, verify as argonVerify } from "argon2";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Response.json({ 
        error: 'همه فیلدها الزامی است' 
      }, { status: 400 });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return Response.json({ 
        error: 'رمز جدید و تایید آن مطابقت ندارند' 
      }, { status: 400 });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return Response.json({ 
        error: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد' 
      }, { status: 400 });
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return Response.json({ 
        error: 'رمز عبور جدید باید شامل حروف و اعداد باشد' 
      }, { status: 400 });
    }

    // Check for common weak passwords
    const weakPasswords = ['12345678', 'password', 'admin123', '11111111', '00000000'];
    if (weakPasswords.includes(newPassword.toLowerCase())) {
      return Response.json({ 
        error: 'رمز عبور انتخابی بسیار ساده است. لطفاً رمز قوی‌تری انتخاب کنید' 
      }, { status: 400 });
    }

    // Get user account info
    const accountQuery = await sql`
      SELECT aa.*, u.id as user_id, u.failed_login_attempts, u.account_locked_until
      FROM auth_accounts aa
      LEFT JOIN users u ON aa."userId" = u.auth_user_id
      WHERE aa."userId" = ${session.user.id} 
      AND aa.type = 'credentials'
    `;

    if (accountQuery.length === 0) {
      return Response.json({ error: 'حساب کاربری یافت نشد' }, { status: 404 });
    }

    const account = accountQuery[0];

    // Check if account is locked
    if (account.account_locked_until && new Date() < new Date(account.account_locked_until)) {
      return Response.json({ 
        error: 'حساب شما موقتاً قفل شده است. لطفاً بعداً تلاش کنید' 
      }, { status: 423 });
    }

    // Verify current password with argon2
    const isValid = await argonVerify(account.password, currentPassword);
    if (!isValid) {
      // Increment failed attempts
      const newFailedAttempts = (account.failed_login_attempts || 0) + 1;
      let lockUntil = null;

      if (newFailedAttempts >= 5) {
        // Lock account for 15 minutes after 5 failed attempts
        lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await sql`
        UPDATE users 
        SET 
          failed_login_attempts = ${newFailedAttempts},
          account_locked_until = ${lockUntil}
        WHERE auth_user_id = ${session.user.id}
      `;

      return Response.json({ 
        error: 'رمز عبور فعلی اشتباه است',
        attemptsLeft: Math.max(0, 5 - newFailedAttempts)
      }, { status: 400 });
    }

    // Check if new password is same as current
    const newPasswordHash = await argonHash(newPassword);
    const isSame = await argonVerify(account.password, newPassword);
    if (isSame) {
      return Response.json({ 
        error: 'رمز عبور جدید نمی‌تواند مشابه رمز فعلی باشد' 
      }, { status: 400 });
    }

    // Check password history (prevent reusing last 3 passwords)
    const passwordHistory = await sql`
      SELECT password_hash FROM password_history 
      WHERE user_id = ${account.user_id}
      ORDER BY created_at DESC 
      LIMIT 3
    `;

    const reusedPassword = await (async () => {
      for (const p of passwordHistory) {
        try {
          if (await argonVerify(p.password_hash, newPassword)) return true;
        } catch {}
      }
      return false;
    })();
    if (reusedPassword) {
      return Response.json({ 
        error: 'نمی‌توانید از رمزهای قبلی استفاده کنید' 
      }, { status: 400 });
    }

    // Update password
    await sql`
      UPDATE auth_accounts 
      SET password = ${newPasswordHash}
      WHERE "userId" = ${session.user.id} 
      AND type = 'credentials'
    `;

    // Reset failed login attempts
    await sql`
      UPDATE users 
      SET 
        failed_login_attempts = 0,
        account_locked_until = NULL
      WHERE auth_user_id = ${session.user.id}
    `;

    // Add to password history
    await sql`
      INSERT INTO password_history (user_id, password_hash)
      VALUES (${account.user_id}, ${newPasswordHash})
    `;

    // Clean old password history (keep only last 5)
    await sql`
      DELETE FROM password_history 
      WHERE user_id = ${account.user_id}
      AND id NOT IN (
        SELECT id FROM password_history 
        WHERE user_id = ${account.user_id}
        ORDER BY created_at DESC 
        LIMIT 5
      )
    `;

    return Response.json({ 
      message: 'رمز عبور با موفقیت تغییر کرد'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return Response.json({ error: 'خطای سرور در تغییر رمز عبور' }, { status: 500 });
  }
}