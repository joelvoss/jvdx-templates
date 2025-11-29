import crypto from 'node:crypto';
import { Firestore as GCFirestore } from '@google-cloud/firestore';
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
	let snap = await client.collection('books').get();
	let books = snap.docs.map(doc => {
		return { id: doc.id, ...doc.data() };
	});
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
	let snap = await client.collection('books').doc(id).get();
	if (!snap.exists) return null;
	return snap.data() as Book;
}

////////////////////////////////////////////////////////////////////////////////

interface CreateBookPayload extends Omit<Book, 'id'> {}

/**
 * Create a new book in the 'books' collection.
 */
async function createBook(payload: CreateBookPayload) {
	let id = crypto.randomUUID();
	let book: Book = { id, ...payload };
	await client.collection('books').doc(id).set(book);
	return true;
}

////////////////////////////////////////////////////////////////////////////////

interface UpdateBookPayload extends AtLeast<Book, 'id'> {}

/**
 * Update a book in the 'books' collection by its ID.
 */
async function updateBook(payload: UpdateBookPayload) {
	let { id, ...rest } = payload;
	await client.collection('books').doc(id).update(rest);
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
	await client.collection('books').doc(id).delete();
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
