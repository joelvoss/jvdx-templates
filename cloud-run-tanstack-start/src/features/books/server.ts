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

export const getBook = createServerFn({ method: "GET" })
	.inputValidator(GetBookSchema)
	.handler(async ({ data }) => {
		const snap = await firestore.doc(`${BOOKS_COLLECTION}/${data.id}`).get();
		if (!snap.exists) return null;
		return { id: snap.id, ...snap.data() } as Book;
	});

////////////////////////////////////////////////////////////////////////////////

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

function getBookIsbnRef(isbn: string) {
	return firestore
		.collection(BOOK_ISBN_INDEX_COLLECTION)
		.doc(normalizeISBN(isbn));
}
