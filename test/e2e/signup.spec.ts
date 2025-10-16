import { test, expect } from '@playwright/test';

test.describe('Signup grade/major flow', () => {
	test('shows major only for دهم/یازدهم/دوازدهم and posts profile', async ({ page }) => {
		await page.goto('/account/signup');
		await page.getByLabel('نام و نام خانوادگی').fill('کاربر تستی');
		await page.getByLabel('ایمیل').fill(`test${Date.now()}@example.com`);
		await page.getByLabel('رمز عبور').fill('Passw0rd!');

		// انتخاب پایه نهم => رشته نباید نمایش داده شود
		await page.getByRole('radio', { name: 'نهم' }).check();
		await expect(page.getByText('رشته تحصیلی')).toHaveCount(0);

		// تغییر به یازدهم => رشته باید نمایش داده شود
		await page.getByRole('radio', { name: 'یازدهم' }).check();
		await expect(page.getByText('رشته تحصیلی')).toHaveCount(1);
		await page.getByRole('radio', { name: 'ریاضی' }).check();

		await page.getByRole('button', { name: 'ثبت‌نام' }).click();

		// پس از ثبت‌نام، باید به صفحه اصلی هدایت شویم
		await page.waitForURL('**/');
	});
});






