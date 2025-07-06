// Playwright end-to-end tests for the /books page and its main table view.
import { expect, test } from '@playwright/test';

test.describe('/books Page', () => {
	test('should display the books table', async ({ page }) => {
		await page.goto('http://localhost:3000/books');
		// Check for table or main heading
		await expect(page.locator('table')).toBeVisible();
		// Optionally check for a known column or text
		await expect(page.locator('body')).toContainText(/titel|autor|jahr/i);
	});

	test('should create, edit, and delete a book', async ({ page }) => {
		await page.goto('http://localhost:3000/books');

		// Create a new book
		await page.getByRole('button', { name: /buch hinzufügen/i }).click();
		await page.getByLabel('Titel').fill('Test Book');
		await page.getByLabel('Autor').fill('Test Author');
		await page.getByLabel('Jahr').fill('2025');
		await page.getByRole('button', { name: /erstellen/i }).click();

		// Assert the new book row exists
		const createdRow = page.locator('tr', { hasText: 'Test Book' });
		await expect(createdRow).toContainText('Test Book');
		await expect(createdRow).toContainText('Test Author');
		await expect(createdRow).toContainText('2025');

		// Edit the book
		await createdRow.getByRole('button', { name: /bearbeiten/i }).click();
		await page.getByLabel('Titel').fill('Updated Book');
		await page.getByRole('button', { name: /aktualisieren/i }).click();

		// Assert the updated book row exists and old title is gone
		const updatedRow = page.locator('tr', { hasText: 'Updated Book' });
		await expect(updatedRow).toContainText('Updated Book');
		await expect(updatedRow).toContainText('Test Author');
		await expect(updatedRow).toContainText('2025');
		await expect(page.locator('tr', { hasText: 'Test Book' })).toHaveCount(0);

		// Delete the book
		await updatedRow.getByRole('button', { name: /löschen/i }).click();
		// Wait for the row to be removed
		await expect(page.locator('tr', { hasText: 'Updated Book' })).toHaveCount(
			0,
		);
	});
});
