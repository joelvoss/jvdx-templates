// Playwright end-to-end tests for the /robots.txt route
import { expect, test } from '@playwright/test';

test.describe('/robots.txt', () => {
	test('should return robots.txt content', async ({ page }) => {
		const response = await page.goto('http://localhost:3000/robots.txt');
		expect(response?.status()).toBe(200);
		const text = await page.textContent('body');
		expect(text).toMatch(/User-agent|Disallow|Allow/);
	});
});
