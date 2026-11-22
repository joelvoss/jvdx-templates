import * as v from "valibot";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type Book, CreateBookSchema } from "~/features/books/schema";

import {
	InMemoryFirestore,
	resetFirestore,
} from "../../../fixtures/in-memory-firestore";

////////////////////////////////////////////////////////////////////////////////

vi.mock("@tanstack/react-start", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-start")>(
		"@tanstack/react-start",
	);

	return {
		...actual,
		createServerFn: () => ({
			validator: (_validator: unknown) => ({
				handler: (fn: (payload?: { data?: unknown }) => unknown) => {
					return async (payload?: { data?: unknown } | unknown) => {
						if (payload && typeof payload === "object" && "data" in payload) {
							return fn(payload as { data?: unknown });
						}

						return fn({ data: payload });
					};
				},
			}),
		}),
	};
});

////////////////////////////////////////////////////////////////////////////////

vi.mock("@google-cloud/firestore", () => ({
	Firestore: InMemoryFirestore,
}));

////////////////////////////////////////////////////////////////////////////////

const seededBooks: Book[] = [
	{
		id: "book-1",
		title: "The Pragmatic Programmer",
		author: "David Thomas, Andrew Hunt",
		isbn: "978-0135957059",
		description: "Your journey to mastery",
		publishedYear: 2019,
		coverImageUrl: "",
		createdAt: new Date("2024-01-01T00:00:00.000Z").getTime(),
		updatedAt: new Date("2024-01-01T00:00:00.000Z").getTime(),
	},
	{
		id: "book-2",
		title: "Clean Code",
		author: "Robert C. Martin",
		isbn: "978-0132350884",
		description: "A Handbook of Agile Software Craftsmanship",
		publishedYear: 2008,
		coverImageUrl: "",
		createdAt: new Date("2024-01-02T00:00:00.000Z").getTime(),
		updatedAt: new Date("2024-01-02T00:00:00.000Z").getTime(),
	},
];

////////////////////////////////////////////////////////////////////////////////

async function importDb() {
	vi.resetModules();
	return import("~/features/books/server");
}

async function setupDb(books = seededBooks) {
	resetFirestore(books);
	return importDb();
}

////////////////////////////////////////////////////////////////////////////////

describe("features/books/server", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("getBooks", () => {
		it("returns a new array each call", async () => {
			const db = await setupDb();

			const a = await db.getBooks({ data: {} });
			const b = await db.getBooks({ data: {} });

			expect(a).not.toBe(b);
			expect(a).toHaveLength(2);
			expect(b).toHaveLength(2);
		});

		it("sorts by title ascending", async () => {
			const db = await setupDb();
			const result = await db.getBooks({ data: { sort: "title" } });

			expect(result.map((b) => b.title)).toEqual([
				"Clean Code",
				"The Pragmatic Programmer",
			]);
		});

		it("sorts by author ascending", async () => {
			const db = await setupDb();
			const result = await db.getBooks({ data: { sort: "author" } });

			expect(result.map((b) => b.author)).toEqual([
				"David Thomas, Andrew Hunt",
				"Robert C. Martin",
			]);
		});

		it("sorts by year descending", async () => {
			const db = await setupDb();
			const result = await db.getBooks({ data: { sort: "year" } });

			expect(result.map((b) => b.publishedYear)).toEqual([2019, 2008]);
		});
	});

	describe("getBook", () => {
		it("returns the book when it exists", async () => {
			const db = await setupDb();
			const book = await db.getBook({ data: { id: "book-1" } });

			expect(book?.title).toBe("The Pragmatic Programmer");
		});

		it("returns null when it does not exist", async () => {
			const db = await setupDb();
			const book = await db.getBook({ data: { id: "does-not-exist" } });

			expect(book).toBeNull();
		});
	});

	describe("CreateBookSchema", () => {
		it("converts publishedYear strings to numbers", async () => {
			const parsed = v.safeParse(CreateBookSchema, {
				title: "Test Book",
				author: "Someone",
				isbn: "978-0132350884",
				publishedYear: "2020",
			});

			expect(parsed.success).toBe(true);
			if (parsed.success) {
				expect(parsed.output.publishedYear).toBe(2020);
			}
		});

		it("rejects invalid ISBN", async () => {
			const parsed = v.safeParse(CreateBookSchema, {
				title: "Test Book",
				author: "Someone",
				isbn: "not-an-isbn",
				publishedYear: 2020,
			});

			expect(parsed.success).toBe(false);
		});

		it("rejects invalid coverImageUrl when provided", async () => {
			const parsed = v.safeParse(CreateBookSchema, {
				title: "Test Book",
				author: "Someone",
				isbn: "978-0132350884",
				publishedYear: 2020,
				coverImageUrl: "not-a-url",
			});

			expect(parsed.success).toBe(false);
		});

		it("rejects invalid publishedYear values", async () => {
			for (const publishedYear of [999, 2024.5, Infinity]) {
				const parsed = v.safeParse(CreateBookSchema, {
					title: "Test Book",
					author: "Someone",
					isbn: "978-0132350884",
					publishedYear,
				});

				expect(parsed.success).toBe(false);
			}
		});
	});

	describe("createBook", () => {
		it("creates a new book with deterministic timestamps", async () => {
			const db = await setupDb();

			const parsed = v.safeParse(CreateBookSchema, {
				title: "New Book",
				author: "New Author",
				isbn: "978-1111111111",
				description: "A long enough description",
				publishedYear: "2024",
			});
			expect(parsed.success).toBe(true);
			if (!parsed.success) return;

			const book = await db.createBook({ data: parsed.output });

			expect(book.id).toBe("book-3");
			expect(book.coverImageUrl).toBe("");
			expect(new Date(book.createdAt).toISOString()).toBe(
				"2025-01-01T00:00:00.000Z",
			);
			expect(new Date(book.updatedAt).toISOString()).toBe(
				"2025-01-01T00:00:00.000Z",
			);
		});

		it("rejects duplicate ISBNs", async () => {
			const db = await setupDb();

			const parsed = v.safeParse(CreateBookSchema, {
				title: "Dup",
				author: "Author",
				isbn: "978-0132350884",
				publishedYear: 2020,
			});
			expect(parsed.success).toBe(true);
			if (!parsed.success) return;

			await expect(db.createBook({ data: parsed.output })).rejects.toThrow(
				"A book with this ISBN already exists.",
			);
		});
	});

	describe("updateBook", () => {
		it("throws when the book does not exist", async () => {
			const db = await setupDb();

			await expect(
				db.updateBook({ data: { id: "missing", title: "Nope" } }),
			).rejects.toThrow("Book not found");
		});

		it("updates fields and bumps updatedAt", async () => {
			const db = await setupDb();

			vi.setSystemTime(new Date("2025-01-01T00:00:01.000Z"));
			const updated = await db.updateBook({
				data: { id: "book-1", title: "Pragmatic Programmer (2nd)" },
			});

			expect(updated?.title).toBe("Pragmatic Programmer (2nd)");
			expect(new Date(updated?.updatedAt).toISOString()).toBe(
				"2025-01-01T00:00:01.000Z",
			);
		});

		it("allows clearing optional fields", async () => {
			const db = await setupDb();

			const updated = await db.updateBook({
				data: { id: "book-1", description: "", coverImageUrl: "" },
			});

			expect(updated.description).toBe("");
			expect(updated.coverImageUrl).toBe("");
		});

		it("releases the previous ISBN when a book is updated", async () => {
			const db = await setupDb();

			await db.updateBook({ data: { id: "book-1", isbn: "978-1111111111" } });

			await expect(
				db.createBook({
					data: {
						title: "Replacement",
						author: "Someone",
						isbn: "978-0135957059",
						publishedYear: 2024,
					},
				}),
			).resolves.toMatchObject({ isbn: "978-0135957059" });
		});

		it("rejects ISBN collisions across different books", async () => {
			const db = await setupDb();

			const createParsed = v.safeParse(CreateBookSchema, {
				title: "Third",
				author: "Author",
				isbn: "978-2222222222",
				publishedYear: 2020,
			});
			expect(createParsed.success).toBe(true);
			if (!createParsed.success) return;
			await db.createBook({ data: createParsed.output });

			await expect(
				db.updateBook({ data: { id: "book-3", isbn: "978-0132350884" } }),
			).rejects.toThrow("A book with this ISBN already exists.");
		});
	});

	describe("deleteBook", () => {
		it("deletes an existing book", async () => {
			const db = await setupDb();

			await db.deleteBook({ data: { id: "book-2" } });

			const fetched = await db.getBook({ data: { id: "book-2" } });
			expect(fetched).toBeNull();
		});

		it("ignores missing books", async () => {
			const db = await setupDb();
			await expect(
				db.deleteBook({ data: { id: "missing" } }),
			).resolves.toBeUndefined();
		});

		it("releases ISBNs after deleting books", async () => {
			const db = await setupDb();

			await db.deleteBook({ data: { id: "book-2" } });

			await expect(
				db.createBook({
					data: {
						title: "Replacement",
						author: "Someone",
						isbn: "978-0132350884",
						publishedYear: 2024,
					},
				}),
			).resolves.toMatchObject({ isbn: "978-0132350884" });
		});
	});
});
