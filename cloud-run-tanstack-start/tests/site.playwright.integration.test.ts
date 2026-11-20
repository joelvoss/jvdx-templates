import { spawn, type ChildProcess } from "node:child_process";

import {
	chromium,
	type Browser,
	type BrowserContext,
	type Page,
} from "playwright";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "vitest";

import type { Book } from "~/features/books/schema";

////////////////////////////////////////////////////////////////////////////////

type ServerReadyMessage = {
	type: "ready";
	baseURL: string;
};

type StoreCommand =
	| { action: "reset"; books?: Book[] }
	| {
			action: "failNext";
			operation: "read" | "write" | "delete" | "any";
			message: string;
			persistent?: boolean;
	  }
	| { action: "snapshot" };

const STARTUP_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 20_000;

const SEEDED_BOOKS: Book[] = [
	{
		id: "book-1",
		title: "The Pragmatic Programmer",
		author: "David Thomas, Andrew Hunt",
		isbn: "978-0135957059",
		description: "Your journey to mastery in software craftsmanship.",
		publishedYear: 2019,
		coverImageUrl: "https://example.com/pragmatic.jpg",
		createdAt: Date.UTC(2024, 0, 10),
		updatedAt: Date.UTC(2024, 2, 15),
	},
	{
		id: "book-2",
		title: "Clean Code",
		author: "Robert C. Martin",
		isbn: "978-0132350884",
		description: "A Handbook of Agile Software Craftsmanship.",
		publishedYear: 2008,
		coverImageUrl: "",
		createdAt: Date.UTC(2024, 0, 11),
		updatedAt: Date.UTC(2024, 0, 12),
	},
	{
		id: "book-3",
		title: "Designing Data-Intensive Applications",
		author: "Martin Kleppmann",
		isbn: "978-1449373320",
		description: "The big ideas behind reliable, scalable systems.",
		publishedYear: 2017,
		coverImageUrl: "",
		createdAt: Date.UTC(2024, 0, 12),
		updatedAt: Date.UTC(2024, 0, 12),
	},
];

let serverProcess: ChildProcess;
let baseURL = "";
let serverLogs = "";
let ipcMessageId = 0;
let browser: Browser;
let context: BrowserContext | undefined;
let page: Page;
let pageErrors: string[] = [];

////////////////////////////////////////////////////////////////////////////////

function sendStoreCommand(command: StoreCommand) {
	const id = ++ipcMessageId;
	return new Promise<Book[]>((resolve, reject) => {
		const timeout = setTimeout(() => {
			serverProcess.off("message", onMessage);
			reject(new Error(`Timed out waiting for store command\n${serverLogs}`));
		}, 5000);

		function onMessage(message: { id?: number; books: Book[] }) {
			if (message.id !== id) return;
			clearTimeout(timeout);
			serverProcess.off("message", onMessage);
			resolve(message.books);
		}

		serverProcess.on("message", onMessage);
		serverProcess.send({ id, ...command });
	});
}

async function openPage() {
	context = await browser.newContext({ baseURL });
	page = await context.newPage();
	page.setDefaultTimeout(5_000);
	pageErrors = [];
	page.on("pageerror", (error) => pageErrors.push(error.message));
	return { context, page };
}

////////////////////////////////////////////////////////////////////////////////

describe("site browser integration", () => {
	beforeAll(async () => {
		serverProcess = spawn(
			"node",
			["./tests/fixtures/site-integration-server.mjs"],
			{
				cwd: process.cwd(),
				env: {
					...process.env,
					NODE_ENV: "development",
					SESSION_SECRET: "site-integration-secret-at-least-32-characters",
					K_SERVICE: "",
				},
				stdio: ["ignore", "pipe", "pipe", "ipc"],
			},
		);

		serverProcess.stdout?.on("data", (chunk) => {
			serverLogs += String(chunk);
		});
		serverProcess.stderr?.on("data", (chunk) => {
			serverLogs += String(chunk);
		});

		const ready = await new Promise<ServerReadyMessage>((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(
					new Error(`Site integration server did not start\n${serverLogs}`),
				);
			}, STARTUP_TIMEOUT_MS - 1000);

			serverProcess.once("error", (error) => {
				clearTimeout(timeout);
				reject(error);
			});
			serverProcess.once("exit", (code) => {
				clearTimeout(timeout);
				reject(
					new Error(
						`Site integration server exited early (${code})\n${serverLogs}`,
					),
				);
			});
			serverProcess.once("message", (message: ServerReadyMessage) => {
				clearTimeout(timeout);
				resolve(message);
			});
		});

		expect(ready.type).toBe("ready");
		baseURL = ready.baseURL;
		browser = await chromium.launch();
	}, STARTUP_TIMEOUT_MS);

	afterAll(async () => {
		await browser?.close();
		if (
			!serverProcess ||
			serverProcess.exitCode !== null ||
			serverProcess.signalCode !== null
		) {
			return;
		}
		await new Promise<void>((resolve) => {
			const timeout = setTimeout(() => serverProcess.kill("SIGKILL"), 6000);
			serverProcess.once("exit", () => {
				clearTimeout(timeout);
				resolve();
			});
			serverProcess.kill("SIGTERM");
		});
	}, 15_000);

	beforeEach(async () => {
		await sendStoreCommand({ action: "reset", books: SEEDED_BOOKS });
		await openPage();
	});

	afterEach(async () => {
		await context?.close();
		context = undefined;
	});

	it(
		"renders the home page with security headers, session cookies, and navigation chrome",
		async () => {
			const response = await page.goto("/", { waitUntil: "networkidle" });
			expect(response?.status()).toBe(200);

			const headers = response?.headers() ?? {};
			expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
			expect(headers["x-content-type-options"]).toBe("nosniff");
			expect(headers["referrer-policy"]).toBe("no-referrer");
			expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
			expect(headers["cross-origin-resource-policy"]).toBe("same-origin");
			expect(headers["x-powered-by"]).toBeUndefined();

			expect(await page.title()).toBe("Home | Book Manager");
			expect(await page.locator("html").getAttribute("lang")).toBe("en");
			expect(await page.locator("html").getAttribute("dir")).toBe("ltr");

			await expect(
				page
					.getByRole("heading", { name: "Welcome to Book Manager" })
					.isVisible(),
			).resolves.toBe(true);
			await expect(
				page.getByRole("link", { name: "View Books" }).isVisible(),
			).resolves.toBe(true);
			await expect(
				page.getByRole("link", { name: "Add New Book" }).isVisible(),
			).resolves.toBe(true);
			await expect(
				page
					.locator("footer")
					.getByText(`Book Manager — © ${new Date().getFullYear()}`)
					.isVisible(),
			).resolves.toBe(true);

			const cookies = await context!.cookies();
			const sessionCookie = cookies.find((c) => c.name === "__app_session");
			const csrfCookie = cookies.find((c) => c.name === "__app_csrf");
			expect(sessionCookie?.httpOnly).toBe(true);
			expect(csrfCookie?.value).toBeTruthy();
			expect(pageErrors).toEqual([]);
		},
		TEST_TIMEOUT_MS,
	);

	it(
		"switches locales, redirects default /en URLs canonically, and localizes 404 pages",
		async () => {
			await page.goto("/", { waitUntil: "networkidle" });

			const switcher = page.getByRole("group", { name: "Language" });
			expect(
				await switcher
					.getByRole("link", { name: "EN" })
					.getAttribute("aria-current"),
			).toBe("page");

			await Promise.all([
				page.waitForURL("**/de"),
				switcher.getByRole("link", { name: "DE" }).click(),
			]);
			await page.waitForLoadState("networkidle");

			expect(await page.locator("html").getAttribute("lang")).toBe("de");
			expect(await page.title()).toBe("Startseite | Book Manager");
			expect(
				await page
					.getByRole("heading", { name: "Willkommen beim Book Manager" })
					.isVisible(),
			).toBe(true);

			const deSwitcher = page.getByRole("group", { name: "Sprache" });
			expect(
				await deSwitcher
					.getByRole("link", { name: "DE" })
					.getAttribute("aria-current"),
			).toBe("page");

			const localeCookie = (await context!.cookies()).find(
				(c) => c.name === "__app_locale",
			);
			expect(localeCookie?.value).toBe("de");

			// Default /en prefix redirects canonically to /books.
			const redirectResponse = await page.request.get("/en/books", {
				maxRedirects: 0,
			});
			expect(redirectResponse.status()).toBe(301);
			expect(new URL(redirectResponse.headers().location).pathname).toBe(
				"/books",
			);

			// Invalid locale path returns 404 without duplicating navigation/footer.
			const invalidLocaleRes = await page.goto("/fr/books", {
				waitUntil: "networkidle",
			});
			expect(invalidLocaleRes?.status()).toBe(404);
			expect(await page.locator("nav").count()).toBe(1);
			expect(await page.locator("footer").count()).toBe(1);
			expect(
				await page.getByRole("button", { name: "Go back" }).isVisible(),
			).toBe(true);

			// German 404 page uses German translations.
			const deNotFoundRes = await page.goto("/de/does-not-exist", {
				waitUntil: "networkidle",
			});
			expect(deNotFoundRes?.status()).toBe(404);
			expect(
				await page
					.getByRole("heading", { name: "Seite nicht gefunden" })
					.isVisible(),
			).toBe(true);
			expect(
				await page.getByRole("button", { name: "Zurück gehen" }).isVisible(),
			).toBe(true);
			expect(pageErrors).toEqual([]);
		},
		TEST_TIMEOUT_MS,
	);

	it(
		"renders empty books state and navigates to create form",
		async () => {
			await sendStoreCommand({ action: "reset", books: [] });

			await page.goto("/books", { waitUntil: "networkidle" });
			expect(await page.title()).toBe("Books | Book Manager");
			expect(await page.getByText("No books found").isVisible()).toBe(true);

			await page.getByRole("link", { name: "Add your first book" }).click();
			await page.waitForURL("**/books/new");
			await page
				.getByRole("button", { name: "Create Book" })
				.waitFor({ state: "visible" });

			await page.getByRole("link", { name: "Cancel" }).click();
			await page.waitForURL((url) => url.pathname === "/books");
			expect(pageErrors).toEqual([]);
		},
		TEST_TIMEOUT_MS,
	);

	it(
		"lists seeded books and sorts them by title, author, year, and default",
		async () => {
			await page.goto("/books", { waitUntil: "networkidle" });

			const cardTitles = () => page.locator("main a h2").allTextContents();
			expect(await cardTitles()).toEqual([
				"The Pragmatic Programmer",
				"Clean Code",
				"Designing Data-Intensive Applications",
			]);

			await page.getByRole("link", { name: "Title" }).click();
			await page.waitForURL(
				(url) =>
					url.pathname === "/books" && url.searchParams.get("sort") === "title",
			);
			await expect
				.poll(cardTitles)
				.toEqual([
					"Clean Code",
					"Designing Data-Intensive Applications",
					"The Pragmatic Programmer",
				]);

			await page.getByRole("link", { name: "Author" }).click();
			await page.waitForURL(
				(url) =>
					url.pathname === "/books" &&
					url.searchParams.get("sort") === "author",
			);
			await expect
				.poll(cardTitles)
				.toEqual([
					"The Pragmatic Programmer",
					"Designing Data-Intensive Applications",
					"Clean Code",
				]);

			await page.getByRole("link", { name: "Year" }).click();
			await page.waitForURL(
				(url) =>
					url.pathname === "/books" && url.searchParams.get("sort") === "year",
			);
			await expect
				.poll(cardTitles)
				.toEqual([
					"The Pragmatic Programmer",
					"Designing Data-Intensive Applications",
					"Clean Code",
				]);

			await page.getByRole("link", { name: "Default" }).click();
			await page.waitForURL(
				(url) => url.pathname === "/books" && !url.searchParams.has("sort"),
			);
			await expect
				.poll(cardTitles)
				.toEqual([
					"The Pragmatic Programmer",
					"Clean Code",
					"Designing Data-Intensive Applications",
				]);

			// Localized sorting works under /de/books.
			await page.goto("/de/books?sort=title", { waitUntil: "networkidle" });
			expect(
				await page.getByRole("heading", { name: "Bücher" }).isVisible(),
			).toBe(true);
			expect(await cardTitles()).toEqual([
				"Clean Code",
				"Designing Data-Intensive Applications",
				"The Pragmatic Programmer",
			]);
			expect(pageErrors).toEqual([]);
		},
		TEST_TIMEOUT_MS,
	);

	it(
		"validates book creation, surfaces duplicate ISBN errors, and creates a new book",
		async () => {
			await page.goto("/books/new", { waitUntil: "networkidle" });
			expect(await page.title()).toBe("New Book | Book Manager");

			// Client-side Valibot validation displays field-level issues.
			await page.getByLabel("Title").fill("A");
			await page.getByLabel("Author").fill("B");
			await page.getByLabel("ISBN").fill("not-an-isbn");
			await page.getByLabel("Published Year").fill("2024");
			await page.getByLabel("Description").fill("short");
			await page.getByLabel("Cover Image URL").fill("not-a-url");
			await page.getByRole("button", { name: "Create Book" }).click();

			await expect
				.poll(() =>
					page
						.getByText("Title must be at least 2 characters long")
						.isVisible(),
				)
				.toBe(true);
			expect(
				await page
					.getByText("Author must be at least 2 characters long")
					.isVisible(),
			).toBe(true);
			expect(
				await page
					.getByText("ISBN must be valid (10 or 13 digits, hyphens optional)")
					.isVisible(),
			).toBe(true);
			expect(
				await page
					.getByText(
						"Description must be at least 10 characters long if provided",
					)
					.isVisible(),
			).toBe(true);
			expect(
				await page.getByText("Cover image URL must be a valid URL").isVisible(),
			).toBe(true);

			// Server-side duplicate ISBN surfaces in the global alert banner.
			await page.getByLabel("Title").fill("Refactoring");
			await page.getByLabel("Author").fill("Martin Fowler");
			await page.getByLabel("ISBN").fill("978-0132350884");
			await page.getByLabel("Published Year").fill("2018");
			await page
				.getByLabel("Description")
				.fill("Improving the design of existing code.");
			await page.getByLabel("Cover Image URL").fill("");
			await page.getByRole("button", { name: "Create Book" }).click();

			const alert = page.getByRole("alert");
			await alert.waitFor({ state: "visible" });
			expect(await alert.textContent()).toContain("Book creation failed");
			expect(await alert.textContent()).toContain(
				"A book with this ISBN already exists.",
			);

			// Unique ISBN succeeds, shows toast, and redirects to /books.
			await page.getByLabel("ISBN").fill("978-0134757599");
			await page.getByRole("button", { name: "Create Book" }).click();

			await page.waitForURL((url) => url.pathname === "/books");
			await page.getByText("Book Created").waitFor({ state: "visible" });
			await page
				.getByRole("heading", { name: "Refactoring" })
				.waitFor({ state: "visible" });
			expect(pageErrors).toEqual([]);
		},
		TEST_TIMEOUT_MS,
	);

	it(
		"shows book details and returns 404 for missing book detail and edit routes",
		async () => {
			await page.goto("/books", { waitUntil: "networkidle" });
			await page
				.getByRole("heading", { name: "The Pragmatic Programmer" })
				.click();
			await page.waitForURL("**/books/book-1");
			await page
				.getByRole("heading", { name: "The Pragmatic Programmer" })
				.waitFor({ state: "visible" });
			await expect.poll(() => page.title()).toBe("Book Details | Book Manager");
			expect(
				await page.getByText("David Thomas, Andrew Hunt").isVisible(),
			).toBe(true);
			expect(await page.getByText("978-0135957059").isVisible()).toBe(true);
			expect(await page.getByText("2019").isVisible()).toBe(true);
			expect(
				await page
					.getByAltText("Cover of The Pragmatic Programmer")
					.getAttribute("src"),
			).toBe("https://example.com/pragmatic.jpg");
			expect(await page.getByText(/^Created:/).isVisible()).toBe(true);
			expect(await page.getByText(/^Last updated:/).isVisible()).toBe(true);

			// Missing book detail route returns HTTP 404 with single layout chrome
			// and a working "Go back" button.
			const missingDetail = await page.goto("/books/does-not-exist", {
				waitUntil: "networkidle",
			});
			expect(missingDetail?.status()).toBe(404);
			expect(
				await page.getByRole("heading", { name: "Page Not Found" }).isVisible(),
			).toBe(true);
			expect(await page.locator("nav").count()).toBe(1);
			expect(await page.locator("footer").count()).toBe(1);

			await page.getByRole("button", { name: "Go back" }).click();
			await page.waitForURL((url) => url.pathname === "/books/book-1");

			// Missing book edit route and localized missing book also return HTTP 404.
			const missingEdit = await page.goto("/books/does-not-exist/edit", {
				waitUntil: "networkidle",
			});
			expect(missingEdit?.status()).toBe(404);

			const missingDeDetail = await page.goto("/de/books/does-not-exist", {
				waitUntil: "networkidle",
			});
			expect(missingDeDetail?.status()).toBe(404);
			expect(
				await page
					.getByRole("heading", { name: "Seite nicht gefunden" })
					.isVisible(),
			).toBe(true);
			expect(await page.locator("nav").count()).toBe(1);
			expect(await page.locator("footer").count()).toBe(1);
			expect(pageErrors).toEqual([]);
		},
		TEST_TIMEOUT_MS,
	);

	it(
		"edits a book, shows duplicate ISBN errors, and persists cleared optional fields",
		async () => {
			await page.goto("/books/book-1", { waitUntil: "networkidle" });
			await page.getByRole("link", { name: "Edit" }).click();
			await page.waitForURL("**/books/book-1/edit");
			await page
				.getByRole("button", { name: "Save Changes" })
				.waitFor({ state: "visible" });
			await expect.poll(() => page.title()).toBe("Edit Book | Book Manager");
			expect(await page.getByLabel("Title").inputValue()).toBe(
				"The Pragmatic Programmer",
			);
			expect(await page.getByLabel("ISBN").inputValue()).toBe("978-0135957059");

			// Updating to another book's ISBN shows the global error banner.
			await page.getByLabel("ISBN").fill("978-0132350884");
			await page.getByRole("button", { name: "Save Changes" }).click();

			const alert = page.getByRole("alert");
			await alert.waitFor({ state: "visible" });
			expect(await alert.textContent()).toContain("Book update failed");
			expect(await alert.textContent()).toContain(
				"A book with this ISBN already exists.",
			);

			// Valid update + clearing optional description and cover URL succeeds.
			await page.getByLabel("Title").fill("The Pragmatic Programmer (20th)");
			await page.getByLabel("ISBN").fill("978-0135957059");
			await page.getByLabel("Description").fill("");
			await page.getByLabel("Cover Image URL").fill("");
			await page.getByRole("button", { name: "Save Changes" }).click();

			await page.getByText("Book Updated").waitFor({ state: "visible" });

			await page.getByRole("link", { name: "Cancel" }).click();
			await page.waitForURL((url) => url.pathname === "/books/book-1");
			await page
				.getByRole("heading", { name: "The Pragmatic Programmer (20th)" })
				.waitFor({ state: "visible" });
			expect(
				await page
					.getByText("Your journey to mastery in software craftsmanship.")
					.count(),
			).toBe(0);
			expect(
				await page
					.getByAltText("Cover of The Pragmatic Programmer (20th)")
					.count(),
			).toBe(0);
			expect(pageErrors).toEqual([]);
		},
		TEST_TIMEOUT_MS,
	);

	it(
		"handles delete modal cancel, error display and reset, and successful deletion",
		async () => {
			await page.goto("/books/book-2", { waitUntil: "networkidle" });

			// Open delete dialog and cancel.
			await page.getByRole("link", { name: "Delete" }).click();
			await page.waitForURL("**/books/book-2?modal=delete");

			const dialog = page.getByRole("dialog");
			await dialog.waitFor({ state: "visible" });
			expect(await dialog.locator("strong").textContent()).toBe("Clean Code");

			await dialog.getByRole("button", { name: "Cancel" }).click();
			await page.waitForURL(
				(url) => url.pathname === "/books/book-2" && !url.search,
			);
			await dialog.waitFor({ state: "hidden" });

			// Reopen dialog, trigger a server error, verify alert, then reset on close.
			await sendStoreCommand({
				action: "failNext",
				operation: "delete",
				message: "Simulated delete failure",
			});
			await page.getByRole("link", { name: "Delete" }).click();
			await dialog.waitFor({ state: "visible" });
			await dialog.getByRole("button", { name: "Delete" }).click();

			const dialogAlert = dialog.getByRole("alert");
			await dialogAlert.waitFor({ state: "visible" });
			expect(await dialogAlert.textContent()).toContain("Book deletion failed");
			expect(await dialogAlert.textContent()).toContain(
				"Simulated delete failure",
			);

			await dialog.getByRole("button", { name: "Cancel" }).click();
			await dialog.waitFor({ state: "hidden" });

			// Reopening should have cleared the previous error; confirming deletes book.
			await page.getByRole("link", { name: "Delete" }).click();
			await dialog.waitFor({ state: "visible" });
			expect(await dialog.getByRole("alert").count()).toBe(0);

			await dialog.getByRole("button", { name: "Delete" }).click();
			await page.waitForURL((url) => url.pathname === "/books");
			await page.getByText("Book Deleted").waitFor({ state: "visible" });
			expect(
				await page.getByRole("heading", { name: "Clean Code" }).count(),
			).toBe(0);

			// Deleted book route now returns 404.
			const deletedRes = await page.goto("/books/book-2", {
				waitUntil: "networkidle",
			});
			expect(deletedRes?.status()).toBe(404);
			expect(pageErrors).toEqual([]);
		},
		TEST_TIMEOUT_MS,
	);

	it(
		"blocks browser mutations when the CSRF cookie is missing and surfaces the failure",
		async () => {
			await page.goto("/books/new", { waitUntil: "networkidle" });

			// Remove the readable CSRF mirror cookie while keeping the session cookie.
			await context!.clearCookies({ name: "__app_csrf" });

			await page.getByLabel("Title").fill("Blocked Book");
			await page.getByLabel("Author").fill("Test Author");
			await page.getByLabel("ISBN").fill("978-1111111111");
			await page.getByLabel("Published Year").fill("2024");
			await page.getByRole("button", { name: "Create Book" }).click();

			const alert = page.getByRole("alert");
			await alert.waitFor({ state: "visible" });
			expect(await alert.textContent()).toContain("Book creation failed");

			const storedBooks = await sendStoreCommand({ action: "snapshot" });
			expect(storedBooks.some((b) => b.title === "Blocked Book")).toBe(false);
			expect(pageErrors).toEqual([]);
		},
		TEST_TIMEOUT_MS,
	);

	it(
		"renders the book list error boundary when loading books fails",
		async () => {
			await sendStoreCommand({
				action: "failNext",
				operation: "read",
				message: "Simulated Firestore outage",
				persistent: true,
			});

			await page.goto("/books", { waitUntil: "domcontentloaded" });
			await page
				.getByText("There was an unexpected error loading the books.")
				.waitFor({ state: "visible", timeout: 12_000 });
			expect(
				await page
					.getByText(
						"Please try again later or contact support if the problem persists.",
					)
					.isVisible(),
			).toBe(true);
		},
		TEST_TIMEOUT_MS,
	);
});
