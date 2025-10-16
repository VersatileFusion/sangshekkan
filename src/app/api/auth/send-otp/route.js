import { POST as sendOtp } from '@/app/api/auth/otp/send/route';

// This alias endpoint accepts both { mobileNumber } and { phone }
// and forwards the request to the canonical /api/auth/otp/send handler.
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {}

  const { mobileNumber, phone, ...rest } = body || {};
  const normalized = { phone: phone || mobileNumber, ...rest };

  const forwarded = new Request(request.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(normalized),
  });

  return sendOtp(forwarded);
}


