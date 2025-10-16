import prisma from "@/app/api/utils/prisma";
import { hash as argonHash, verify as argonVerify } from "argon2";
import { auth } from "@/auth";

/**
 * Change Password Endpoint
 * Allows authenticated users to change their password by providing current password verification
 */
export async function POST(request) {
  try {
    // Get authenticated session
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return Response.json(
        { error: 'احراز هویت نشده. لطفاً دوباره وارد شوید.' },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json(
        { error: 'فرمت درخواست نامعتبر است.' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Response.json(
        { error: 'همه فیلدها الزامی هستند.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return Response.json(
        { error: 'رمز عبور جدید و تکرار آن مطابقت ندارند.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return Response.json(
        { error: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return Response.json(
        { error: 'رمز عبور باید شامل حروف و اعداد باشد.' },
        { status: 400 }
      );
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, name: true, phone: true },
    });

    if (!user) {
      return Response.json(
        { error: 'کاربر یافت نشد.' },
        { status: 404 }
      );
    }

    // Verify current password
    let isCurrentPasswordValid = false;
    try {
      isCurrentPasswordValid = await argonVerify(user.password, currentPassword);
    } catch (verifyError) {
      console.error('Password verification error:', verifyError);
      return Response.json(
        { error: 'خطا در بررسی رمز عبور فعلی.' },
        { status: 500 }
      );
    }

    if (!isCurrentPasswordValid) {
      return Response.json(
        { error: 'رمز عبور فعلی نادرست است.' },
        { status: 400 }
      );
    }

    // Hash new password
    let hashedPassword;
    try {
      hashedPassword = await argonHash(newPassword);
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return Response.json(
        { error: 'خطا در رمزنگاری رمز عبور جدید.' },
        { status: 500 }
      );
    }

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log(`✅ Password changed successfully for user: ${user.phone || user.id}`);

    return Response.json(
      { 
        success: true,
        message: 'رمز عبور با موفقیت تغییر کرد.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Change password error:', error);
    return Response.json(
      { error: 'خطای سرور در تغییر رمز عبور. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}

