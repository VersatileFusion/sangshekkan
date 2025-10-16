import { notifySangshekanOnSignup } from "@/app/api/utils/sms";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userPhoneNumber = typeof body?.userPhone === 'string' ? body.userPhone : '09120000000';
    const ok = await notifySangshekanOnSignup(userPhoneNumber);
    return new Response(
      JSON.stringify({ ok }),
      { status: ok ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}






