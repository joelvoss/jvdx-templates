import { randomUUID } from 'node:crypto';

import { Firestore as GCFirestore } from '@google-cloud/firestore';

import { logger } from '~/lib/logger';
import type { AtLeast } from '~/types';

////////////////////////////////////////////////////////////////////////////////

interface Book {
	id: string;
	title: string;
	author: string;
}

////////////////////////////////////////////////////////////////////////////////

let client = new GCFirestore({ ignoreUndefinedProperties: true });

////////////////////////////////////////////////////////////////////////////////

/**
 * Get all books from the 'books' collection.
 */
async function getBooks() {
	logger.info('Reading books from Firestore');
	let snap = await client.collection('books').get();
	let books = snap.docs.map((doc) => {
		return { id: doc.id, ...doc.data() };
	});
	logger.info('Read books from Firestore', { total: books.length });
	return books as Book[];
}

////////////////////////////////////////////////////////////////////////////////

interface GetBookPayload {
	id: string;
}

/**
 * Get a book from the 'books' collection by its ID.
 */
async function getBook(payload: GetBookPayload) {
	let { id } = payload;
	logger.addContext({ bookId: id });
	logger.info('Reading book from Firestore');
	let snap = await client.collection('books').doc(id).get();
	if (!snap.exists) {
		logger.warn('Book missing in Firestore');
		return null;
	}
	logger.info('Read book from Firestore');
	return { id: snap.id, ...snap.data() } as Book;
}

////////////////////////////////////////////////////////////////////////////////

interface CreateBookPayload extends Omit<Book, 'id'> {}

/**
 * Create a new book in the 'books' collection.
 */
async function createBook(payload: CreateBookPayload) {
	let id = randomUUID();
	logger.addContext({ bookId: id });
	let book: Book = { id, ...payload };
	logger.info('Writing book to Firestore');
	await client.collection('books').doc(id).set(book);
	logger.info('Wrote book to Firestore');
	return true;
}

////////////////////////////////////////////////////////////////////////////////

interface UpdateBookPayload extends AtLeast<Book, 'id'> {}

/**
 * Update a book in the 'books' collection by its ID.
 */
async function updateBook(payload: UpdateBookPayload) {
	let { id, ...rest } = payload;
	logger.addContext({ bookId: id });
	logger.info('Updating book in Firestore');
	await client.collection('books').doc(id).update(rest);
	logger.info('Updated book in Firestore');
	return true;
}

////////////////////////////////////////////////////////////////////////////////

interface DeleteBookPayload {
	id: string;
}

/**
 * Delete a book from the 'books' collection by its ID.
 */
async function deleteBook(payload: DeleteBookPayload) {
	let { id } = payload;
	logger.addContext({ bookId: id });
	logger.info('Deleting book from Firestore');
	await client.collection('books').doc(id).delete();
	logger.info('Deleted book from Firestore');
	return true;
}

////////////////////////////////////////////////////////////////////////////////

export let Firestore = {
	getBooks,
	getBook,
	createBook,
	updateBook,
	deleteBook,
};
