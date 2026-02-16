import * as v from "valibot";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

////////////////////////////////////////////////////////////////////////////////

vi.mock("@google-cloud/firestore", () => {
	const store = new Map<string, Map<string, Record<string, unknown>>>();

	const ensureCollection = (name: string) => {
		let col = store.get(name);
		if (!col) {
			col = new Map();
			store.set(name, col);
		}
		return col;
	};

	class DocumentSnapshot {
		id: string;
		private _data?: Record<string, unknown>;

		constructor(id: string, data?: Record<string, unknown>) {
			this.id = id;
			this._data = data;
		}

		get exists() {
			return Boolean(this._data);
		}

		data() {
			return this._data;
		}
	}

	class QuerySnapshot {
		docs: DocumentSnapshot[];

		constructor(docs: DocumentSnapshot[]) {
			this.docs = docs;
		}

		get empty() {
			return this.docs.length === 0;
		}
	}

	type Filter = { field: string; op: string; value: unknown };
	type Order = { field: string; direction: "asc" | "desc" };

	class Query {
		protected _collection: string;
		protected _filters: Filter[];
		protected _orders: Order[];

		constructor(
			collection: string,
			filters: Filter[] = [],
			orders: Order[] = [],
		) {
			this._collection = collection;
			this._filters = filters;
			this._orders = orders;
		}

		where(field: string, op: string, value: unknown) {
			return new Query(
				this._collection,
				[...this._filters, { field, op, value }],
				this._orders,
			);
		}

		orderBy(field: string, direction: "asc" | "desc" = "asc") {
			return new Query(this._collection, this._filters, [
				...this._orders,
				{ field, direction },
			]);
		}

		async get() {
			const col = ensureCollection(this._collection);
			let docs = Array.from(col.entries()).map(
				([id, data]) => new DocumentSnapshot(id, data),
			);

			for (const filter of this._filters) {
				docs = docs.filter((doc) => {
					const data = doc.data() ?? {};
					const value = filter.field === "id" ? doc.id : data[filter.field];
					switch (filter.op) {
						case "==":
							return value === filter.value;
						case "!=":
							return value !== filter.value;
						default:
							return true;
					}
				});
			}

			for (const order of this._orders) {
				docs = docs.sort((a, b) => {
					const aData = a.data() ?? {};
					const bData = b.data() ?? {};
					const aValue = order.field === "id" ? a.id : aData[order.field];
					const bValue = order.field === "id" ? b.id : bData[order.field];
					const aComparable =
						typeof aValue === "number" || typeof aValue === "string"
							? aValue
							: String(aValue);
					const bComparable =
						typeof bValue === "number" || typeof bValue === "string"
							? bValue
							: String(bValue);
					if (aValue === bValue) return 0;
					if (aValue === undefined) return order.direction === "asc" ? 1 : -1;
					if (bValue === undefined) return order.direction === "asc" ? -1 : 1;
					return order.direction === "asc"
						? aComparable < bComparable
							? -1
							: 1
						: aComparable < bComparable
							? 1
							: -1;
				});
			}

			return new QuerySnapshot(docs);
		}
	}

	class DocumentReference {
		private _collection: string;
		private _id: string;

		constructor(collection: string, id: string) {
			this._collection = collection;
			this._id = id;
		}

		get id() {
			return this._id;
		}

		async get() {
			const col = ensureCollection(this._collection);
			const data = col.get(this._id);
			return new DocumentSnapshot(this._id, data);
		}

		async set(data: Record<string, unknown>) {
			const col = ensureCollection(this._collection);
			col.set(this._id, data);
		}

		async update(data: Record<string, unknown>) {
			const col = ensureCollection(this._collection);
			const existing = col.get(this._id) ?? {};
			col.set(this._id, { ...existing, ...data });
		}

		async delete() {
			const col = ensureCollection(this._collection);
			col.delete(this._id);
		}
	}

	class CollectionReference extends Query {
		doc(id: string) {
			return new DocumentReference(this._collection, id);
		}
	}

	class Transaction {
		async get(ref: DocumentReference | Query) {
			return ref.get();
		}

		update(ref: DocumentReference, data: Record<string, unknown>) {
			return ref.update(data);
		}
	}

	class Firestore {
		collection(name: string) {
			return new CollectionReference(name);
		}

		doc(path: string) {
			const [collection, id] = path.split("/");
			return new DocumentReference(collection, id);
		}

		async runTransaction<T>(fn: (t: Transaction) => Promise<T>) {
			const transaction = new Transaction();
			return await fn(transaction);
		}
	}

	return {
		Firestore,
		__resetMockData() {
			store.clear();
		},
		__seedMockData(
			collection: string,
			docs: Array<Record<string, unknown> & { id: string }>,
		) {
			const col = ensureCollection(collection);
			for (const doc of docs) {
				col.set(doc.id, { ...doc });
			}
		},
	};
});

vi.mock("~/lib/uid", () => {
	let counter = 3;
	return {
		uid: () => `book-${counter++}`,
		__resetUid() {
			counter = 3;
		},
	};
});

////////////////////////////////////////////////////////////////////////////////

const seededBooks = [
	{
		id: "book-1",
		title: "The Pragmatic Programmer",
		author: "David Thomas, Andrew Hunt",
		isbn: "978-0135957059",
		description: "Your journey to mastery",
		publishedYear: 2019,
		coverImageUrl: "",
		createdAt: new Date("2024-01-01T00:00:00.000Z"),
		updatedAt: new Date("2024-01-01T00:00:00.000Z"),
	},
	{
		id: "book-2",
		title: "Clean Code",
		author: "Robert C. Martin",
		isbn: "978-0132350884",
		description: "A Handbook of Agile Software Craftsmanship",
		publishedYear: 2008,
		coverImageUrl: "",
		createdAt: new Date("2024-01-02T00:00:00.000Z"),
		updatedAt: new Date("2024-01-02T00:00:00.000Z"),
	},
];

async function seedBooks(books = seededBooks) {
	const firestoreMock =
		(await import("@google-cloud/firestore")) as unknown as {
			__resetMockData: () => void;
			__seedMockData: (
				collection: string,
				docs: Array<Record<string, unknown> & { id: string }>,
			) => void;
		};
	firestoreMock.__resetMockData();
	firestoreMock.__seedMockData("books", books);

	const uidMock = (await import("~/lib/uid")) as unknown as {
		__resetUid: () => void;
	};
	uidMock.__resetUid();
}

////////////////////////////////////////////////////////////////////////////////

async function importDb() {
	vi.resetModules();
	return await import("~/adapter/firestore");
}

async function setupDb(books = seededBooks) {
	const db = await importDb();
	await seedBooks(books);
	return db;
}

////////////////////////////////////////////////////////////////////////////////

describe("adapter/database", () => {
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

			const a = await db.getBooks();
			const b = await db.getBooks();

			expect(a).not.toBe(b);
			expect(a).toHaveLength(2);
			expect(b).toHaveLength(2);
		});

		it("sorts by title ascending", async () => {
			const db = await setupDb();
			const result = await db.getBooks({ sort: "title" });

			expect(result.map((b) => b.title)).toEqual([
				"Clean Code",
				"The Pragmatic Programmer",
			]);
		});

		it("sorts by author ascending", async () => {
			const db = await setupDb();
			const result = await db.getBooks({ sort: "author" });

			expect(result.map((b) => b.author)).toEqual([
				"David Thomas, Andrew Hunt",
				"Robert C. Martin",
			]);
		});

		it("sorts by year descending", async () => {
			const db = await setupDb();
			const result = await db.getBooks({ sort: "year" });

			expect(result.map((b) => b.publishedYear)).toEqual([2019, 2008]);
		});
	});

	describe("getBook", () => {
		it("returns the book when it exists", async () => {
			const db = await setupDb();
			const book = await db.getBook({ id: "book-1" });

			expect(book?.title).toBe("The Pragmatic Programmer");
		});

		it("returns null when it does not exist", async () => {
			const db = await setupDb();
			const book = await db.getBook({ id: "does-not-exist" });

			expect(book).toBeNull();
		});
	});

	describe("CreateBookSchema", () => {
		it("converts publishedYear strings to numbers", async () => {
			const db = await importDb();

			const parsed = v.safeParse(db.CreateBookSchema, {
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
			const db = await importDb();

			const parsed = v.safeParse(db.CreateBookSchema, {
				title: "Test Book",
				author: "Someone",
				isbn: "not-an-isbn",
				publishedYear: 2020,
			});

			expect(parsed.success).toBe(false);
		});

		it("rejects invalid coverImageUrl when provided", async () => {
			const db = await importDb();

			const parsed = v.safeParse(db.CreateBookSchema, {
				title: "Test Book",
				author: "Someone",
				isbn: "978-0132350884",
				publishedYear: 2020,
				coverImageUrl: "not-a-url",
			});

			expect(parsed.success).toBe(false);
		});
	});

	describe("createBook", () => {
		it("creates a new book with deterministic timestamps", async () => {
			const db = await setupDb();

			const parsed = v.safeParse(db.CreateBookSchema, {
				title: "New Book",
				author: "New Author",
				isbn: "978-1111111111",
				description: "A long enough description",
				publishedYear: "2024",
			});
			expect(parsed.success).toBe(true);
			if (!parsed.success) return;

			const book = await db.createBook(parsed.output);

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

			const parsed = v.safeParse(db.CreateBookSchema, {
				title: "Dup",
				author: "Author",
				isbn: "978-0132350884",
				publishedYear: 2020,
			});
			expect(parsed.success).toBe(true);
			if (!parsed.success) return;

			await expect(db.createBook(parsed.output)).rejects.toThrow(
				"A book with this ISBN already exists.",
			);
		});
	});

	describe("updateBook", () => {
		it("throws when the book does not exist", async () => {
			const db = await setupDb();

			await expect(
				db.updateBook({ id: "missing", title: "Nope" }),
			).rejects.toThrow("Book not found");
		});

		it("updates fields and bumps updatedAt", async () => {
			const db = await setupDb();

			vi.setSystemTime(new Date("2025-01-01T00:00:01.000Z"));
			const updated = await db.updateBook({
				id: "book-1",
				title: "Pragmatic Programmer (2nd)",
			});

			expect(updated?.title).toBe("Pragmatic Programmer (2nd)");
			expect(new Date(updated?.updatedAt).toISOString()).toBe(
				"2025-01-01T00:00:01.000Z",
			);
		});

		it("rejects ISBN collisions across different books", async () => {
			const db = await setupDb();

			const createParsed = v.safeParse(db.CreateBookSchema, {
				title: "Third",
				author: "Author",
				isbn: "978-2222222222",
				publishedYear: 2020,
			});
			expect(createParsed.success).toBe(true);
			if (!createParsed.success) return;
			await db.createBook(createParsed.output);

			await expect(
				db.updateBook({ id: "book-3", isbn: "978-0132350884" }),
			).rejects.toThrow("A book with this ISBN already exists.");
		});
	});

	describe("deleteBook", () => {
		it("deletes an existing book", async () => {
			const db = await setupDb();

			await db.deleteBook({ id: "book-2" });

			const fetched = await db.getBook({ id: "book-2" });
			expect(fetched).toBeNull();
		});

		it("ignores missing books", async () => {
			const db = await setupDb();
			await expect(db.deleteBook({ id: "missing" })).resolves.toBeUndefined();
		});
	});
});
