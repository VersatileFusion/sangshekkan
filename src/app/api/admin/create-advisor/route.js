import prisma from "@/app/api/utils/prisma";
import { hash as argonHash } from "argon2";
import { Prisma } from "@prisma/client";

/**
 * API Route: Create/Update Admin Advisor Account
 * 
 * این اندپوینت برای ساخت یا به‌روزرسانی اولین کاربر ادمین (مشاور) استفاده می‌شود.
 * برای امنیت، نیاز به ارسال هدر x-admin-secret دارد که با ADMIN_SETUP_SECRET مطابقت داشته باشد.
 * 
 * Required ENV Variables:
 * - ADMIN_SETUP_SECRET: کلید امنیتی برای احراز هویت درخواست
 * - DEFAULT_ADVISOR_PASSWORD: رمز عبور پیش‌فرض برای حساب ادمین
 */
export async function POST(request) {
  try {
    // Step 1: Security check - Verify admin secret header
    const providedSecret = request.headers.get("x-admin-secret");
    const expectedSecret = process.env.ADMIN_SETUP_SECRET;
    
    if (!expectedSecret) {
      console.error('ADMIN_SETUP_SECRET is not configured in environment variables');
      return Response.json({ 
        error: 'سرور به‌درستی پیکربندی نشده است. لطفاً ADMIN_SETUP_SECRET را تنظیم کنید.' 
      }, { status: 500 });
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      console.warn('Unauthorized admin creation attempt - invalid or missing x-admin-secret header');
      return Response.json({ 
        error: 'دسترسی غیرمجاز. هدر x-admin-secret معتبر نیست.' 
      }, { status: 403 });
    }

    // Step 2: Get password from environment or use default
    const password = process.env.DEFAULT_ADVISOR_PASSWORD || "change-me-now";
    
    if (!process.env.DEFAULT_ADVISOR_PASSWORD) {
      console.warn('DEFAULT_ADVISOR_PASSWORD not set in environment, using default weak password');
    }

    // Step 3: Hash the password using Argon2
    const passwordHash = await argonHash(password);

    // Step 4: Define admin user data
    const adminPhone = "09923182082"; // شماره موبایل خانم سنگ‌شکن
    const adminName = "خانم سنگ شکن (مشاور تحصیلی)";
    const adminRole = "ADMIN";

    // Step 5: Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { phone: adminPhone },
    });

    let adminUser;

    if (existingAdmin) {
      // Update existing admin user
      console.log(`Updating existing admin user with phone: ${adminPhone}`);
      
      adminUser = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          name: adminName,
          password: passwordHash,
          role: adminRole,
          phoneVerifiedAt: new Date(),
          isVerified: true,
          status: "ACTIVE",
        },
      });

      console.log(`Admin user updated successfully: ${adminUser.id}`);
      
      return Response.json({
        success: true,
        message: 'حساب ادمین با موفقیت به‌روزرسانی شد',
        user: {
          id: adminUser.id,
          name: adminUser.name,
          phone: adminUser.phone,
          role: adminUser.role,
          isVerified: adminUser.isVerified,
          createdAt: adminUser.createdAt,
        },
      });
    } else {
      // Create new admin user
      console.log(`Creating new admin user with phone: ${adminPhone}`);
      
      adminUser = await prisma.user.create({
        data: {
          phone: adminPhone,
          name: adminName,
          password: passwordHash,
          role: adminRole,
          phoneVerifiedAt: new Date(),
          isVerified: true,
          status: "ACTIVE",
        },
      });

      console.log(`Admin user created successfully: ${adminUser.id}`);
      
      return Response.json({
        success: true,
        message: 'حساب ادمین با موفقیت ایجاد شد',
        user: {
          id: adminUser.id,
          name: adminUser.name,
          phone: adminUser.phone,
          role: adminUser.role,
          isVerified: adminUser.isVerified,
          createdAt: adminUser.createdAt,
        },
      }, { status: 201 });
    }

  } catch (error) {
    // Enhanced error handling with specific Prisma error codes
    console.error('Admin creation/update error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation
      if (error.code === 'P2002') {
        const fields = error.meta?.target || ['شماره موبایل'];
        return Response.json({ 
          error: `این ${fields.join(' یا ')} قبلاً ثبت شده است.`,
          code: 'DUPLICATE_ENTRY',
        }, { status: 409 });
      }

      // P2025: Record not found (for update operations)
      if (error.code === 'P2025') {
        return Response.json({ 
          error: 'رکورد مورد نظر یافت نشد',
          code: 'NOT_FOUND',
        }, { status: 404 });
      }

      // Other Prisma errors
      return Response.json({ 
        error: `خطای دیتابیس: ${error.message}`,
        code: error.code,
      }, { status: 500 });
    }

    // Handle Prisma Client initialization errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error('Prisma client initialization failed:', error.message);
      return Response.json({ 
        error: 'خطا در اتصال به دیتابیس. لطفاً تنظیمات DATABASE_URL را بررسی کنید.',
        code: 'DB_CONNECTION_ERROR',
      }, { status: 500 });
    }

    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error('Prisma validation error:', error.message);
      return Response.json({ 
        error: 'داده‌های ارسالی نامعتبر است',
        code: 'VALIDATION_ERROR',
      }, { status: 400 });
    }

    // Generic error fallback
    return Response.json({ 
      error: 'خطای سرور در ایجاد حساب مشاور. جزئیات در لاگ سرور موجود است.',
      code: 'INTERNAL_ERROR',
    }, { status: 500 });
  }
}
