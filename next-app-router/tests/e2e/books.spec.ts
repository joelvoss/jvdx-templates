import { expect, type Page, test } from '@playwright/test';

const addBookLabel = /buch hinzufügen|add book/i;
const createLabel = /erstellen|create/i;
const updateLabel = /aktualisieren|update/i;
const editLabel = /bearbeiten|edit/i;
const deleteLabel = /löschen|delete/i;

function bookRow(page: Page, title: string) {
	return page.locator('tbody tr').filter({
		has: page.getByRole('cell', { name: title, exact: true }),
	});
}

async function createBook(page: Page, title: string) {
	await page.getByRole('button', { name: addBookLabel }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel(/titel|title/i).fill(title);
	await dialog.getByLabel(/autor|author/i).fill('E2E Author');
	await dialog.getByLabel(/jahr|year/i).fill('2026');
	await dialog.getByRole('button', { name: createLabel }).click();
	await expect(dialog).toBeHidden();
	await expect(bookRow(page, title)).toBeVisible();
}

async function failServerActions(page: Page) {
	await page.route('**/books', async route => {
		if (route.request().method() === 'POST') {
			await route.abort();
			return;
		}
		await route.continue();
	});
}

async function failMutation(page: Page, mutationToFail: number) {
	let mutationCount = 0;
	await page.route('**/books', async route => {
		if (route.request().method() !== 'POST') {
			await route.continue();
			return;
		}

		mutationCount += 1;
		if (mutationCount === mutationToFail) {
			await route.abort();
			return;
		}
		await route.continue();
	});
}

test.describe('/books', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/books');
	});

	test('renders the books table and create action', async ({ page }) => {
		await expect(page.locator('table')).toBeVisible();
		await expect(
			page.getByRole('button', { name: addBookLabel }),
		).toBeVisible();
		await expect(
			page.getByRole('columnheader', { name: /titel|title/i }),
		).toBeVisible();
		await expect(
			page.getByRole('columnheader', { name: /autor|author/i }),
		).toBeVisible();
		await expect(
			page.getByRole('columnheader', { name: /jahr|year/i }),
		).toBeVisible();
	});

	test('creates a book optimistically and closes the dialog', async ({
		page,
	}) => {
		const title = `E2E Create ${Date.now()}`;

		await page.getByRole('button', { name: addBookLabel }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByLabel(/titel|title/i).fill(title);
		await dialog.getByLabel(/autor|author/i).fill('Create Author');
		await dialog.getByLabel(/jahr|year/i).fill('2026');
		await dialog.getByRole('button', { name: createLabel }).click();

		await expect(dialog).toBeHidden();
		await expect(bookRow(page, title)).toContainText('Create Author');
		await expect(bookRow(page, title)).toContainText('2026');

		await bookRow(page, title)
			.getByRole('button', { name: deleteLabel })
			.click();
		await expect(bookRow(page, title)).toHaveCount(0);
	});

	test('edits a book through the shared mutation dialog', async ({ page }) => {
		const title = `E2E Edit ${Date.now()}`;
		const updatedTitle = `${title} Updated`;
		await createBook(page, title);

		await bookRow(page, title).getByRole('button', { name: editLabel }).click();
		const dialog = page.getByRole('dialog');
		await expect(dialog.getByLabel(/titel|title/i)).toHaveValue(title);
		await dialog.getByLabel(/titel|title/i).fill(updatedTitle);
		await dialog.getByRole('button', { name: updateLabel }).click();

		await expect(dialog).toBeHidden();
		await expect(bookRow(page, updatedTitle)).toContainText('E2E Author');
		await expect(bookRow(page, title)).toHaveCount(0);

		await bookRow(page, updatedTitle)
			.getByRole('button', { name: deleteLabel })
			.click();
		await expect(bookRow(page, updatedTitle)).toHaveCount(0);
	});

	test('rolls back a failed create', async ({ page }) => {
		const title = `E2E Failed Create ${Date.now()}`;
		await failServerActions(page);

		await page.getByRole('button', { name: addBookLabel }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByLabel(/titel|title/i).fill(title);
		await dialog.getByLabel(/autor|author/i).fill('Failed Author');
		await dialog.getByLabel(/jahr|year/i).fill('2026');
		await dialog.getByRole('button', { name: createLabel }).click();

		await expect(dialog).toBeHidden();
		await expect(bookRow(page, title)).toHaveCount(0);
		await expect(page.locator('p[role="alert"]')).toBeVisible();
	});

	test('rolls back a failed edit', async ({ page }) => {
		const title = `E2E Failed Edit ${Date.now()}`;
		const updatedTitle = `${title} Updated`;
		await createBook(page, title);
		await failServerActions(page);

		await bookRow(page, title).getByRole('button', { name: editLabel }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByLabel(/titel|title/i).fill(updatedTitle);
		await dialog.getByRole('button', { name: updateLabel }).click();

		await expect(dialog).toBeHidden();
		await expect(bookRow(page, title)).toBeVisible();
		await expect(bookRow(page, updatedTitle)).toHaveCount(0);
		await expect(page.locator('p[role="alert"]')).toBeVisible();

		await page.unroute('**/books');
		await bookRow(page, title)
			.getByRole('button', { name: deleteLabel })
			.click();
		await expect(bookRow(page, title)).toHaveCount(0);
	});

	test('rolls back a failed delete', async ({ page }) => {
		const title = `E2E Failed Delete ${Date.now()}`;
		await createBook(page, title);
		await failServerActions(page);

		await bookRow(page, title)
			.getByRole('button', { name: deleteLabel })
			.click();
		await expect(bookRow(page, title)).toBeVisible();
		await expect(page.locator('p[role="alert"]')).toBeVisible();
	});

	test('keeps mixed concurrent mutations independent when one fails', async ({
		page,
	}) => {
		const firstTitle = `E2E Mixed Edit ${Date.now()}`;
		const secondTitle = `E2E Mixed Delete ${Date.now()}`;
		const updatedTitle = `${firstTitle} Updated`;
		await createBook(page, firstTitle);
		await createBook(page, secondTitle);

		// The edit is allowed to complete. The following delete fails, so the
		// successful edit and failed delete exercise separate optimistic rollbacks.
		await failMutation(page, 2);
		await bookRow(page, firstTitle)
			.getByRole('button', { name: editLabel })
			.click();
		const dialog = page.getByRole('dialog');
		await dialog.getByLabel(/titel|title/i).fill(updatedTitle);
		await dialog.getByRole('button', { name: updateLabel }).click();
		await bookRow(page, secondTitle)
			.getByRole('button', { name: deleteLabel })
			.click();

		await expect(dialog).toBeHidden();
		await expect(bookRow(page, updatedTitle)).toBeVisible();
		await expect(bookRow(page, firstTitle)).toHaveCount(0);
		await expect(bookRow(page, secondTitle)).toBeVisible();
		await expect(page.locator('p[role="alert"]')).toBeVisible();

		await page.unroute('**/books');
		await page.reload();
		for (const title of [updatedTitle, firstTitle, secondTitle]) {
			const row = bookRow(page, title);
			if (await row.count()) {
				await row.getByRole('button', { name: deleteLabel }).click();
				await expect(row).toHaveCount(0);
			}
		}
	});

	test('deletes multiple books in rapid succession', async ({ page }) => {
		const titles = [`E2E Delete A ${Date.now()}`, `E2E Delete B ${Date.now()}`];
		for (const title of titles) await createBook(page, title);

		for (const title of titles) {
			await bookRow(page, title)
				.getByRole('button', { name: deleteLabel })
				.click();
		}

		for (const title of titles)
			await expect(bookRow(page, title)).toHaveCount(0);
	});

	test('shows the saved status icon when mutations are idle', async ({
		page,
	}) => {
		const status = page.getByRole('img', { name: /gespeichert|saved/i });
		await expect(status).toBeVisible();
	});
});
