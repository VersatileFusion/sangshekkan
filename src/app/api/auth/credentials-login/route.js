import prisma from "@/app/api/utils/prisma";
import { verify as argonVerify } from "argon2";
import { normalizeIranPhone } from "@/app/api/utils/sms";
import { encode as encodeJwt } from "@auth/core/jwt";

function normalizeCandidates(identifier) {
  const raw = String(identifier || "").trim().replace(/[\s-]/g, "");
  if (!raw) return [];
  const cands = new Set();
  cands.add(raw);
  try {
    const n = normalizeIranPhone(raw);
    cands.add(n);
    if (n.startsWith("+98")) cands.add("0" + n.slice(3));
  } catch {}
  if (raw.startsWith("+98")) cands.add("0" + raw.slice(3));
  if (raw.startsWith("98")) cands.add("0" + raw.slice(2));
  return Array.from(cands);
}

export async function POST(request) {
  try {
    let body = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const identifier = body?.identifier ?? body?.phone ?? body?.email;
    const password = String(body?.password || "");
    if (!identifier || !password) {
      return Response.json({ error: "شناسه و رمز عبور الزامی است" }, { status: 400 });
    }

    const phones = normalizeCandidates(identifier);

    // Find by phone (schema has no email field)
    const user = await prisma.user.findFirst({
      where: { OR: phones.map((p) => ({ phone: p })) },
    });

    if (!user) {
      return Response.json({ error: "شماره موبایل یافت نشد", field: "identifier" }, { status: 404 });
    }

    const ok = await argonVerify(user.password, password).catch(() => false);
    if (!ok) {
      return Response.json({ error: "رمز عبور نادرست است", field: "password" }, { status: 401 });
    }

    // Create Auth.js-compatible JWT session token and set cookie
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      sub: user.id,
      name: user.name ?? null,
      email: `${user.phone}@local.host`,
      role: user.role,
      phone: user.phone,
      iat: now,
      exp: now + 60 * 60 * 24 * 30, // 30 days
    };

    const isProd = process.env.NODE_ENV === "production";
    const cookieName = isProd ? "__Secure-authjs.session-token" : "authjs.session-token";
    const secret = process.env.AUTH_SECRET || 'development-insecure-auth-secret-change-me';
    const sessionToken = await encodeJwt({
      token: tokenPayload,
      secret,
      maxAge: 60 * 60 * 24 * 30,
      salt: cookieName,
    });
    const cookieParts = [
      `${cookieName}=${sessionToken}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${60 * 60 * 24 * 30}`,
    ];
    if (isProd) {
      cookieParts.push("Secure");
    } else {
      // Add domain for localhost development
      cookieParts.push("Domain=localhost");
    }
    const cookieHeader = cookieParts.join("; ");

    const nextUrl = user.role === "ADMIN" ? "/admin" : "/student-dashboard";

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, phone: user.phone, name: user.name ?? null, role: user.role },
        nextUrl,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookieHeader,
        },
      }
    );
  } catch (error) {
    const err = error;
    let serialized = null;
    try { serialized = JSON.stringify(err); } catch { serialized = '[unserializable error]'; }
    try {
      console.error(
        '🔥🔥🔥 CREDENTIALS_LOGIN_FAILURE 🔥🔥🔥',
        {
          message: err?.message,
          stack: err?.stack,
          cause: err?.cause,
          serialized,
          context: {
            route: '/api/auth/credentials-login',
            nodeEnv: process.env.NODE_ENV,
            hasAuthSecret: Boolean(process.env.AUTH_SECRET),
            hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
          }
        }
      );
    } catch {}
    const isProd = process.env.NODE_ENV === 'production';
    const body = isProd
      ? { error: "خطای سرور" }
      : { error: "خطای سرور", message: err?.message ?? String(err), stack: String(err?.stack || '') };
    return Response.json(body, { status: 500 });
  }
}






