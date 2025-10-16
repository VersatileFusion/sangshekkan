import prisma from "@/app/api/utils/prisma";
import { notifySangshekanOnSignup, normalizeIranPhone } from "@/app/api/utils/sms";

export async function POST(request) {
  try {
    const { phone, code } = await request.json();
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    if (!rawPhone || !code) return Response.json({ error: 'شماره و کد الزامی است' }, { status: 400 });
    const normalizedPhone = normalizeIranPhone(rawPhone);

    // Find valid OTP
    const otp = await prisma.otpCode.findFirst({
      where: { phone: normalizedPhone, purpose: 'signup', code, expiresAt: { gt: new Date() }, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) return Response.json({ error: 'کد نامعتبر یا منقضی شده است' }, { status: 400 });

    // Create user if not exists
    let user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalizedPhone, role: 'STUDENT', phoneVerifiedAt: new Date(), isVerified: true, status: 'ACTIVE' },
      });
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { phoneVerifiedAt: new Date(), isVerified: true, status: 'ACTIVE' } });
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { isUsed: true } });

    // Notify advisor (Mrs. Sangshekan) about the new signup
    try {
      await notifySangshekanOnSignup(normalizeIranPhone(normalizedPhone));
    } catch {}

    return Response.json({ verified: true, requiresProfile: true, phone: normalizedPhone });
  } catch (error) {
    console.error('verify-otp error:', error);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}


