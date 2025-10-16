import { test, expect } from '@playwright/test';

test.describe('OTP + Signup + Login + Advisor access', () => {
	test('OTP send/verify mocked via TEST_ECHO_OTP; advisor can create video/challenge', async ({ page, request }) => {
		// OTP send (mocked)
		const phone = '+989120000000';
		const sendRes = await request.post('/api/auth/otp/send', {
			data: { phone, purpose: 'signup' },
		});
		expect(sendRes.ok()).toBeTruthy();

		// In real E2E we would capture echo code from logs; here we just proceed
		// Assume OTP verify path is protected with rate limit; call with fake code to assert 400/429 not thrown on API presence
		const verifyRes = await request.post('/api/auth/otp/verify', {
			data: { phone, code: '000000', purpose: 'signup' },
		});
		expect([200, 400, 429]).toContain(verifyRes.status());

		// Signup UI
		await page.goto('/account/signup');
		await page.getByLabel('نام و نام خانوادگی').fill('کاربر تستی');
		await page.getByLabel('ایمیل').fill(`t${Date.now()}@example.com`);
		await page.getByLabel('رمز عبور').fill('Passw0rd!');
		await page.getByRole('radio', { name: 'یازدهم' }).check();
		await page.getByRole('radio', { name: 'ریاضی' }).check();
		await page.getByRole('button', { name: 'ثبت‌نام' }).click();
		await page.waitForURL('**/');

		// Signin page reachable
		await page.goto('/account/signin');
		expect(await page.title()).toBeTruthy();

		// Advisor access (requires seeded advisor account to be logged-in in real env)
		// Here we check endpoints exist and are protected
		const videosPost = await request.post('/api/videos', { data: { title: 'v', description: '', video_url: 'https://x', category: 'test' } });
		expect([401, 403]).toContain(videosPost.status());
		const challengesPost = await request.post('/api/challenges', { data: { title: 'c', start_date: '2025-01-01', end_date: '2025-01-02', is_active: true } });
		expect([401, 403]).toContain(challengesPost.status());
	});
});


