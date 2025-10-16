import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

/**
 * POST /api/student/reports/upload
 * آپلود محلی فایل‌ها (برای Development)
 * برای Production باید از R2 استفاده شود
 */
export async function POST(request) {
  try {
    console.log('📤 [Upload] Starting file upload...');
    
    const session = await auth();
    if (!session?.user) {
      console.error('❌ [Upload] No session');
      return Response.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    console.log('✅ [Upload] User authenticated:', session.user.id);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      console.error('❌ [Upload] No file provided');
      return Response.json({ error: "فایلی انتخاب نشده است" }, { status: 400 });
    }

    console.log('📁 [Upload] File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // بررسی حجم فایل (حداکثر 200MB)
    const MAX_SIZE = 200 * 1024 * 1024; // 200MB
    if (file.size > MAX_SIZE) {
      console.error('❌ [Upload] File too large:', file.size);
      return Response.json({ 
        error: "حجم فایل بیش از حد مجاز است (حداکثر 200MB)" 
      }, { status: 413 });
    }

    // بررسی نوع فایل (فقط تصاویر و PDF)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      console.error('❌ [Upload] Invalid file type:', file.type);
      return Response.json({ 
        error: "فقط فایل‌های تصویری (JPG, PNG, GIF, WebP) و PDF مجاز هستند" 
      }, { status: 400 });
    }

    // ایجاد نام یکتا برای فایل
    const fileExtension = file.name.split(".").pop() || 'bin';
    const safeExtension = fileExtension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const fileName = `${session.user.id}_${randomUUID()}.${safeExtension}`;
    
    // ایجاد مسیر ذخیره‌سازی
    const uploadDir = join(process.cwd(), "public", "uploads", "reports");
    await mkdir(uploadDir, { recursive: true });

    // ذخیره فایل
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log('✅ [Upload] File saved:', filePath);

    // ایجاد URL عمومی
    const fileUrl = `/uploads/reports/${fileName}`;
    const fileKey = fileName;

    console.log('✅ [Upload] Success! URL:', fileUrl);

    return Response.json({
      fileKey,
      fileUrl,
      success: true,
      message: "فایل با موفقیت آپلود شد",
    }, { status: 200 });

  } catch (error) {
    console.error("❌ [Upload] Error:", error);
    console.error("Error details:", error.message);
    return Response.json({ 
      error: "خطا در آپلود فایل",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

