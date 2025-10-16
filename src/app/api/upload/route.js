import { auth } from "@/auth";
import { upload } from "@/app/api/utils/upload";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // JSON body support: { url } or { base64 }
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { url, base64 } = body || {};
      if (!url && !base64) {
        return Response.json({ error: 'درخواست نامعتبر: url یا base64 الزامی است' }, { status: 400 });
      }
      const result = await upload({ url, base64 });
      return Response.json({ url: result.url, mimeType: result.mimeType || null, message: 'آپلود با موفقیت انجام شد' });
    }

    // Raw binary support
    if (contentType.includes('application/octet-stream')) {
      const arrayBuffer = await request.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await upload({ buffer });
      return Response.json({ url: result.url, mimeType: result.mimeType || null, message: 'آپلود با موفقیت انجام شد' });
    }

    // Default: multipart/form-data with file field
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'فایلی انتخاب نشده است' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ 
        error: 'فرمت فایل مجاز نیست. فقط فرمت‌های JPG, PNG, GIF, WEBP مجاز هستند' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ 
        error: 'حجم فایل نباید بیشتر از 5 مگابایت باشد' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to external service
    const result = await upload({ buffer });

    return Response.json({ 
      url: result.url,
      mimeType: result.mimeType,
      message: 'فایل با موفقیت آپلود شد'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'خطا در آپلود فایل' }, { status: 500 });
  }
}