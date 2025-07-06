// Playwright end-to-end tests for the main pages of the Next.js App Router application.
// This file tests the root (home) page, not-found, and global error handling.

import { expect, test } from '@playwright/test';

// Test the home page
// Assumes the app is running at http://localhost:3000

test.describe('Home Page', () => {
	const descEn =
		'This page is rendered on the server (React Server Component) and loads data from GitHub before the page is actually rendered in the browser.';
	const descDe =
		'Diese Seite wird auf dem Server gerendert (React Server Component) und lädt Daten von GitHub, bevor die Seite tatsächlich im Browser gerendert wird.';

	test('should display the home page', async ({ page }) => {
		await page.goto('http://localhost:3000/');
		await expect(page).toHaveTitle(/.+/); // Title should not be empty
		await expect(page.locator('body')).toBeVisible();
		// Check for home page description in English or German (not regex, but as substring)
		const bodyText = await page.locator('body').innerText();
		expect(bodyText.includes(descEn) || bodyText.includes(descDe)).toBeTruthy();
	});

	test('should switch locale via language menu', async ({ page }) => {
		await page.goto('http://localhost:3000/');
		// Open the language menu by aria-label
		await page
			.locator('[aria-label="Language"], [aria-label="Sprache"]')
			.click();
		// Click German by visible text
		await page.locator('text=Deutsch').click();
		await page.waitForLoadState();
		await expect(page.locator('body')).toContainText(descDe);

		// Open the language menu again
		await page
			.locator('[aria-label="Language"], [aria-label="Sprache"]')
			.click();
		// Click English by visible text
		await page.locator('text=English').click();
		await expect(page.locator('body')).toContainText(descEn);
	});

	test('should switch locale via URL', async ({ page }) => {
		// Switch to German
		await page.goto('http://localhost:3000/?hl=de');
		await expect(page.locator('body')).toContainText(descDe);
		// Switch to English
		await page.goto('http://localhost:3000/?hl=en');
		await expect(page.locator('body')).toContainText(descEn);
	});
});

test.describe('Not Found Page', () => {
	test('should show not found for unknown route', async ({ page }) => {
		await page.goto('http://localhost:3000/unknown-route');
		// Accept both English and German headings
		const headingEn = 'Sorry, the page you are looking for was not found';
		const headingDe =
			'Die von Ihnen gesuchte Seite wurde leider nicht gefunden';
		await expect(page.locator('body')).toContainText(
			new RegExp(`${headingEn}|${headingDe}`),
		);
	});
});

// Add more tests for global error if a route is available to trigger it
