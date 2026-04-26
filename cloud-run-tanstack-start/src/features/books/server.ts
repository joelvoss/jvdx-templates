import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

import {
	type Book,
	BookSchema,
	CreateBookSchema,
	DeleteBookSchema,
	GetBookSchema,
	GetBooksSchema,
	normalizeISBN,
	UpdateBookSchema,
} from "~/features/books/schema";
import { firestore } from "~/lib/firestore";
import { uid } from "~/lib/uid";

////////////////////////////////////////////////////////////////////////////////

const BOOKS_COLLECTION = "books";
const BOOK_ISBN_INDEX_COLLECTION = "book_isbns";

////////////////////////////////////////////////////////////////////////////////

/**
 * Gets a list of books, optionally sorted by title, author, or published year.
 */
export const getBooks = createServerFn({ method: "GET" })
	.inputValidator(GetBooksSchema)
	.handler(async ({ data }) => {
		let colRef: FirebaseFirestore.Query =
			firestore.collection(BOOKS_COLLECTION);
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
		return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Book);
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Gets a single book by ID. If the book does not exist, this function returns
 * null.
 */
export const getBook = createServerFn({ method: "GET" })
	.inputValidator(GetBookSchema)
	.handler(async ({ data }) => {
		const snap = await firestore.doc(`${BOOKS_COLLECTION}/${data.id}`).get();
		if (!snap.exists) return null;
		return { id: snap.id, ...snap.data() } as Book;
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a new book. This function first checks if a book with the same ISBN
 * already exists by looking up the ISBN index. If it does, it throws an error.
 * If not, it creates a new book document and an ISBN index document in a
 * transaction to ensure atomicity. The ISBN index document allows us to enforce
 * uniqueness of ISBNs across books without needing to perform a collection
 * scan.
 */
export const createBook = createServerFn({ method: "POST" })
	.inputValidator(CreateBookSchema)
	.handler(async ({ data }) => {
		const now = Date.now();
		const book: Book = {
			id: uid(),
			description: "",
			coverImageUrl: "",
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await firestore.runTransaction(async (transaction) => {
			const bookRef = firestore.collection(BOOKS_COLLECTION).doc(book.id);
			const isbnRef = getBookIsbnRef(book.isbn);
			const existingIsbn = await transaction.get(isbnRef);

			if (existingIsbn.exists) {
				throw new Error("A book with this ISBN already exists.");
			}

			transaction.set(bookRef, book);
			transaction.set(isbnRef, { bookId: book.id });
		});

		return book;
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Updates a book by ID. If the ISBN is being updated, this function also checks
 * for uniqueness of the new ISBN and updates the ISBN index accordingly. If
 * the book does not exist, this function throws an error.
 */
export const updateBook = createServerFn({ method: "POST" })
	.inputValidator(UpdateBookSchema)
	.handler(async ({ data }) => {
		const { id, ...updates } = data;
		const docRef = firestore.collection(BOOKS_COLLECTION).doc(id);

		return firestore.runTransaction(async (transaction) => {
			const doc = await transaction.get(docRef);
			if (!doc.exists) {
				throw new Error("Book not found");
			}

			const currentBook = v.parse(BookSchema, doc.data());
			const book: Book = {
				...currentBook,
				...updates,
				updatedAt: Date.now(),
			};

			const currentIsbnKey = normalizeISBN(currentBook.isbn);
			const nextIsbnKey = normalizeISBN(book.isbn);

			if (currentIsbnKey !== nextIsbnKey) {
				const nextIsbnRef = getBookIsbnRef(book.isbn);
				const nextIsbn = await transaction.get(nextIsbnRef);
				if (nextIsbn.exists) {
					throw new Error("A book with this ISBN already exists.");
				}

				transaction.delete(getBookIsbnRef(currentBook.isbn));
				transaction.set(nextIsbnRef, { bookId: id });
			}

			transaction.update(docRef, book);
			return book;
		});
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Deletes a book by ID. Also deletes the corresponding ISBN index document to
 * maintain data integrity. If the book does not exist, this function does
 * nothing.
 */
export const deleteBook = createServerFn({ method: "POST" })
	.inputValidator(DeleteBookSchema)
	.handler(async ({ data }) => {
		const docRef = firestore.doc(`${BOOKS_COLLECTION}/${data.id}`);

		await firestore.runTransaction(async (transaction) => {
			const doc = await transaction.get(docRef);
			if (!doc.exists) return;

			const book = v.parse(BookSchema, doc.data());
			transaction.delete(docRef);
			transaction.delete(getBookIsbnRef(book.isbn));
		});
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Gets a reference to the ISBN index document for a given ISBN. This is used
 * to enforce uniqueness of ISBNs across books. The document will contain a
 * reference to the book that has that ISBN.
 */
function getBookIsbnRef(isbn: string) {
	return firestore
		.collection(BOOK_ISBN_INDEX_COLLECTION)
		.doc(normalizeISBN(isbn));
}
