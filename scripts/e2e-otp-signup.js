/* E2E: OTP signup/login flow */

const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
const phone = process.env.TEST_PHONE || '09120000000';
const name = process.env.TEST_NAME || 'کاربر تست';
const password = process.env.TEST_PASSWORD || 'Passw0rd!';

async function waitForReady(path = '/api/auth/providers', timeoutMs = 15000) {
  const start = Date.now();
  let lastErr;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(baseUrl + path);
      if (res.status >= 200 && res.status < 500) return true;
      lastErr = new Error('Unexpected status: ' + res.status);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw lastErr || new Error('Server not ready');
}

async function postJson(path, body) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {}
  console.log(`\n[POST] ${path}`);
  console.log('status:', res.status);
  console.log('body:', text);
  return { res, json, text };
}

(async () => {
  try {
    await waitForReady();

    // 1) Send OTP
    const r1 = await postJson('/api/auth/register', { phone });
    if (r1.res.status !== 200) {
      console.error('\nE2E FAILED at step 1 (register)');
      process.exit(1);
    }
    const returnedPhone = (r1.json && r1.json.phone) || phone;
    const code = r1.json && r1.json.debugCode;
    if (!code && process.env.TEST_ECHO_OTP !== 'true') {
      console.warn('No debugCode (real SMS mode). Provide received code via TEST_CODE env.');
    }
    const useCode = code || process.env.TEST_CODE;
    if (!useCode) {
      console.error('Missing OTP code for step 2.');
      process.exit(2);
    }

    // 2) Verify OTP
    const r2 = await postJson('/api/auth/verify-otp', { phone: returnedPhone, code: useCode });
    if (r2.res.status !== 200 || !(r2.json && r2.json.verified)) {
      console.error('\nE2E FAILED at step 2 (verify-otp)');
      process.exit(3);
    }

    // 3) Set password
    const r3 = await postJson('/api/auth/set-password', { phone: returnedPhone, name, password });
    if (r3.res.status !== 200) {
      console.error('\nE2E FAILED at step 3 (set-password)');
      process.exit(4);
    }

    console.log('\nE2E SUCCESS: All steps completed.');
    process.exit(0);
  } catch (err) {
    console.error('\nE2E ERROR:', err?.message || err);
    process.exit(9);
  }
})();






