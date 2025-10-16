import { getLinkPreview } from 'link-preview-js';

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

    const prisma = (await import('@/app/api/utils/prisma')).default;
    return await prisma.user.findUnique({
      where: { id: payload.sub },
    });
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

// Extract YouTube video ID for fallback thumbnail
function getYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

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

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return Response.json({ error: 'URL الزامی است' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return Response.json({ error: 'فرمت URL نامعتبر است' }, { status: 400 });
    }

    // استفاده از link-preview-js برای پشتیبانی همه‌جانبه
    try {
      const previewData = await getLinkPreview(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      // Determine platform
      let platform = 'generic';
      const videoId = getYouTubeVideoId(url);
      
      if (videoId) {
        platform = 'youtube';
      } else if (url.includes('aparat.com')) {
        platform = 'aparat';
      } else if (url.includes('instagram.com')) {
        platform = 'instagram';
      }

      // Extract metadata
      const metadata = {
        title: previewData.title || null,
        description: previewData.description || null,
        image: previewData.images?.[0] || null,
        platform,
      };

      // برای YouTube از thumbnail با کیفیت بالاتر استفاده کن
      if (videoId) {
        metadata.image = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        metadata.videoId = videoId;
      }

      return Response.json(metadata);

    } catch (error) {
      console.error('Error fetching link preview:', error);
      
      // Fallback: حداقل برای YouTube اطلاعات بازگردان
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        return Response.json({
          title: null,
          description: null,
          image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          videoId,
          platform: 'youtube',
        });
      }

      return Response.json(
        { error: 'نمی‌توان اطلاعات لینک را استخراج کرد. لطفاً لینک معتبری وارد کنید.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in unfurl-link:', error);
    return Response.json(
      { error: 'خطا در استخراج اطلاعات لینک', details: error.message },
      { status: 500 }
    );
  }
}

