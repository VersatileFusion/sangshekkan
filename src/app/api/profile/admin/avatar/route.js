import prisma from "@/app/api/utils/prisma";
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Helper to get user from session cookie
async function getUserFromRequest(request) {
  try {
    const { decode } = await import('@auth/core/jwt');
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...v] = c.trim().split('=');
        return [key, v.join('=')];
      })
    );
    
    const sessionToken = cookies['authjs.session-token'] || cookies['__Secure-authjs.session-token'];
    if (!sessionToken) return null;

    const secret = process.env.AUTH_SECRET || 'development-insecure-auth-secret-change-me';
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-authjs.session-token' 
      : 'authjs.session-token';

    const payload = await decode({
      token: sessionToken,
      secret,
      salt: cookieName,
    });

    if (!payload?.sub) return null;

    return await prisma.user.findUnique({
      where: { id: payload.sub },
    });
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

// POST - Upload avatar
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return Response.json({ error: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return Response.json({ error: 'شما دسترسی لازم برای این عملیات را ندارید' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!file) {
      return Response.json({ error: 'فایل انتخاب نشده است' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'فقط فایل‌های JPG و PNG مجاز هستند' }, { status: 400 });
    }

    // Validate file size (200MB max)
    if (file.size > 200 * 1024 * 1024) {
      return Response.json({ error: 'حجم فایل نباید بیشتر از ۲۰۰ مگابایت باشد' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `admin-${user.id}-${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/avatars/${filename}`;

    // Delete old avatar if exists
    if (user.profileImageUrl) {
      try {
        const oldFilepath = join(process.cwd(), 'public', user.profileImageUrl);
        if (existsSync(oldFilepath)) {
          await unlink(oldFilepath);
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { profileImageUrl: publicUrl },
    });

    return Response.json({
      success: true,
      profileImageUrl: updatedUser.profileImageUrl,
    });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return Response.json({ error: 'خطا در آپلود فایل' }, { status: 500 });
  }
}

// DELETE - Remove avatar
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return Response.json({ error: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return Response.json({ error: 'شما دسترسی لازم برای این عملیات را ندارید' }, { status: 403 });
    }

    // Delete file if exists
    if (user.profileImageUrl) {
      try {
        const filepath = join(process.cwd(), 'public', user.profileImageUrl);
        if (existsSync(filepath)) {
          await unlink(filepath);
        }
      } catch (error) {
        console.error('Error deleting avatar file:', error);
      }
    }

    // Update user profile in database
    await prisma.user.update({
      where: { id: user.id },
      data: { profileImageUrl: null },
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error removing avatar:', error);
    return Response.json({ error: 'خطا در حذف عکس' }, { status: 500 });
  }
}

