import { Firestore as GCFirestore } from "@google-cloud/firestore";
import { createServerOnlyFn } from "@tanstack/react-start";
import * as v from "valibot";

import { uid } from "~/lib/uid";

////////////////////////////////////////////////////////////////////////////////

const client = new GCFirestore({
	projectId: process.env.PROJECT,
	ignoreUndefinedProperties: true,
});

////////////////////////////////////////////////////////////////////////////////

export const BookSchema = v.object({
	id: v.string(),
	title: v.string(),
	author: v.string(),
	isbn: v.string(),
	description: v.string(),
	publishedYear: v.number(),
	coverImageUrl: v.string(),
	createdAt: v.number(),
	updatedAt: v.number(),
});

type Book = v.InferOutput<typeof BookSchema>;

////////////////////////////////////////////////////////////////////////////////

export const GetBooksSchema = v.object({
	sort: v.optional(v.picklist(["title", "author", "year"]), undefined),
});

/**
 * Get all books, optionally sorted
 */
export const getBooks = createServerOnlyFn(
	async (data?: v.InferInput<typeof GetBooksSchema>) => {
		let colRef: FirebaseFirestore.Query = client.collection("books");
		if (data?.sort) {
			switch (data.sort) {
				case "title":
					colRef = colRef.orderBy("title");
					break;
				case "author":
					colRef = colRef.orderBy("author");
					break;
				case "year":
					colRef = colRef.orderBy("publishedYear", "desc");
					break;
			}
		}

		const snap = await colRef.get();
		const books = snap.docs.map((doc) => {
			return { id: doc.id, ...doc.data() } as Book;
		});

		return books;
	},
);

////////////////////////////////////////////////////////////////////////////////

export const GetBookSchema = v.object({
	id: v.string(),
});

/**
 * Get a single book by ID
 */
export const getBook = createServerOnlyFn(
	async (data: v.InferOutput<typeof GetBookSchema>) => {
		const snap = await client.doc(`books/${data.id}`).get();
		if (!snap.exists) return null;
		return { id: snap.id, ...snap.data() } as Book;
	},
);

////////////////////////////////////////////////////////////////////////////////

export const CreateBookSchema = v.object({
	title: v.pipe(v.string(), v.minLength(2)),
	author: v.pipe(v.string(), v.minLength(2)),
	isbn: v.pipe(v.string(), v.check(isValidISBN)),
	description: v.optional(v.pipe(v.string(), v.minLength(10))),
	publishedYear: v.pipe(v.union([v.string(), v.number()]), v.toNumber()),
	coverImageUrl: v.optional(v.pipe(v.string(), v.url())),
});

/**
 * Create a new book
 */
export const createBook = createServerOnlyFn(
	async (data: v.InferOutput<typeof CreateBookSchema>) => {
		const now = Date.now();
		const book: Book = {
			id: uid(),
			description: "",
			coverImageUrl: "",
			...data,
			createdAt: now,
			updatedAt: now,
		};

		// NOTE(joel): Check if ISBN already exists.
		if (await isbnExists(data.isbn)) {
			throw new Error("A book with this ISBN already exists.");
		}

		await client.collection("books").doc(book.id).set(book);

		return book;
	},
);

////////////////////////////////////////////////////////////////////////////////

export const UpdateBookSchema = v.object({
	id: v.string(),
	title: v.optional(v.pipe(v.string(), v.minLength(2))),
	author: v.optional(v.pipe(v.string(), v.minLength(2))),
	isbn: v.optional(v.pipe(v.string(), v.check(isValidISBN))),
	description: v.optional(v.pipe(v.string(), v.minLength(10))),
	publishedYear: v.optional(
		v.pipe(v.union([v.string(), v.number()]), v.toNumber()),
	),
	coverImageUrl: v.optional(v.pipe(v.string(), v.url())),
});

/**
 * Update an existing book.
 * We expect an already validated book object.
 */
export const updateBook = createServerOnlyFn(
	async (data: v.InferOutput<typeof UpdateBookSchema>) => {
		const { id, ...updates } = data;

		const docRef = client.collection("books").doc(id);

		const addedBook = await client.runTransaction(async (t) => {
			const doc = await t.get(docRef);
			if (!doc.exists) {
				throw new Error("Book not found");
			}

			const book: Book = {
				...(doc.data() as Book),
				...updates,
				updatedAt: Date.now(),
			};

			// NOTE(joel): Check if ISBN already exists (excluding current book).
			if (await isbnExists(book.isbn, id, t)) {
				throw new Error("A book with this ISBN already exists.");
			}

			t.update(docRef, book);
			return book;
		});

		return addedBook;
	},
);

////////////////////////////////////////////////////////////////////////////////

export const DeleteBookSchema = v.object({
	id: v.string(),
});

/**
 * Delete a book
 */
export const deleteBook = createServerOnlyFn(
	async (data: v.InferOutput<typeof DeleteBookSchema>) => {
		await client.doc(`books/${data.id}`).delete();
	},
);

////////////////////////////////////////////////////////////////////////////////

/**
 * Validate ISBN format (ISBN-10 or ISBN-13)
 */
function isValidISBN(isbn: string): boolean {
	// NOTE(joel): Remove hyphens and spaces
	const cleaned = isbn.replace(/[-\s]/g, "");

	// NOTE(joel): Check if it's 10 or 13 digits (allowing X for ISBN-10)
	if (!/^(\d{9}[\dX]|\d{13})$/.test(cleaned)) {
		return false;
	}

	// NOTE(joel): Basic format validation is sufficient for this app
	// In production, you might want to add checksum validation
	return true;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Check if a book with the given ISBN already exists (excluding a specific ID).
 */
const isbnExists = createServerOnlyFn(
	async (
		isbn: string,
		excludeId?: string,
		t?: FirebaseFirestore.Transaction,
	) => {
		if (t) {
			let query = client.collection("books").where("isbn", "==", isbn);
			if (excludeId) {
				query = query.where("id", "!=", excludeId);
			}
			const snap = await t.get(query);
			return !snap.empty;
		}

		let query = client.collection("books").where("isbn", "==", isbn);
		if (excludeId) {
			query = query.where("id", "!=", excludeId);
		}
		const snap = await query.get();
		return !snap.empty;
	},
);
