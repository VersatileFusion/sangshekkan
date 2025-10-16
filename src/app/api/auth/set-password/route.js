import prisma from "@/app/api/utils/prisma";
import { hash as argonHash, verify as argonVerify } from "argon2";

export async function POST(request) {
  try {
    const { phone, name, password } = await request.json();
    if (!phone || !password) return Response.json({ error: 'شماره و رمز الزامی است' }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 });

    const passwordHash = await argonHash(password);
    await prisma.user.update({ where: { id: user.id }, data: { name: name || user.name, password: passwordHash } });

    // Sign-in is handled client-side via credentials flow after this call
    return Response.json({ ok: true });
  } catch (error) {
    console.error('set-password error:', error);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}






