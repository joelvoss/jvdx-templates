import { randomUUID } from 'node:crypto';

import { Firestore as GCFirestore } from '@google-cloud/firestore';

import { logger } from '~/lib/logger';
import {
	SpanKind,
	SpanStatusCode,
	trace,
	tracer,
	type Exception,
	type Span,
} from '~/lib/trace';
import type { AtLeast } from '~/types';

////////////////////////////////////////////////////////////////////////////////

interface Book {
	id: string;
	title: string;
	author: string;
}

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): The Firestore SDK ships its own built-in OpenTelemetry
// instrumentation that auto-activates as soon as it detects a registered
// global TracerProvider (which `tracerProvider.register()` in `~/lib/trace`
// sets up), regardless of whether we explicitly opt into it. This produces
// extra spans (e.g. `Query.Get`, `BatchGetDocuments`) alongside the manual
// `firestore.books.*` spans below, adding trace noise we don't want. We
// disable it here since we only want to emit our own manually created spans.
// See https://github.com/googleapis/nodejs-firestore/blob/main/dev/src/telemetry/enabled-trace-util.ts
process.env.FIRESTORE_ENABLE_TRACING ??= 'OFF';

let client = new GCFirestore({ ignoreUndefinedProperties: true });

////////////////////////////////////////////////////////////////////////////////

/**
 * Helper function to wrap Firestore operations in a trace span with relevant
 * attributes.
 */
async function withFirestoreSpan<T>(
	name: string,
	attributes: Record<string, string | number | boolean>,
	callback: (span?: Span) => Promise<T>,
) {
	if (!trace.getActiveSpan()) return callback();

	return tracer.startActiveSpan(
		name,
		{
			attributes: {
				'db.system.name': 'firestore',
				'db.collection.name': 'books',
				...attributes,
			},
			kind: SpanKind.CLIENT,
		},
		async (span) => {
			try {
				return await callback(span);
			} catch (err) {
				span.recordException(err as Exception);
				span.setStatus({ code: SpanStatusCode.ERROR });
				throw err;
			} finally {
				span.end();
			}
		},
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Get all books from the 'books' collection.
 */
async function getBooks() {
	return withFirestoreSpan(
		'firestore.books.list',
		{ 'db.operation.name': 'get' },
		async (span) => {
			logger.info('Reading books from Firestore');
			let snap = await client.collection('books').get();
			let books = snap.docs.map((doc) => {
				return { id: doc.id, ...doc.data() };
			});
			span?.setAttribute('db.response.documents', books.length);
			logger.info('Read books from Firestore', { total: books.length });
			return books as Book[];
		},
	);
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
	return withFirestoreSpan(
		'firestore.books.get',
		{ 'db.document.id': id, 'db.operation.name': 'get' },
		async (span) => {
			logger.addContext({ bookId: id });
			logger.info('Reading book from Firestore');
			let snap = await client.collection('books').doc(id).get();
			if (!snap.exists) {
				span?.setAttribute('db.response.found', false);
				logger.warn('Book missing in Firestore');
				return null;
			}
			span?.setAttribute('db.response.found', true);
			logger.info('Read book from Firestore');
			return { id: snap.id, ...snap.data() } as Book;
		},
	);
}

////////////////////////////////////////////////////////////////////////////////

interface CreateBookPayload extends Omit<Book, 'id'> {}

/**
 * Create a new book in the 'books' collection.
 */
async function createBook(payload: CreateBookPayload) {
	let id = randomUUID();
	return withFirestoreSpan(
		'firestore.books.create',
		{ 'db.document.id': id, 'db.operation.name': 'set' },
		async () => {
			logger.addContext({ bookId: id });
			let book: Book = { id, ...payload };
			logger.info('Writing book to Firestore');
			await client.collection('books').doc(id).set(book);
			logger.info('Wrote book to Firestore');
			return true;
		},
	);
}

////////////////////////////////////////////////////////////////////////////////

interface UpdateBookPayload extends AtLeast<Book, 'id'> {}

/**
 * Update a book in the 'books' collection by its ID.
 */
async function updateBook(payload: UpdateBookPayload) {
	let { id, ...rest } = payload;
	return withFirestoreSpan(
		'firestore.books.update',
		{ 'db.document.id': id, 'db.operation.name': 'update' },
		async () => {
			logger.addContext({ bookId: id });
			logger.info('Updating book in Firestore');
			await client.collection('books').doc(id).update(rest);
			logger.info('Updated book in Firestore');
			return true;
		},
	);
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
	return withFirestoreSpan(
		'firestore.books.delete',
		{ 'db.document.id': id, 'db.operation.name': 'delete' },
		async () => {
			logger.addContext({ bookId: id });
			logger.info('Deleting book from Firestore');
			await client.collection('books').doc(id).delete();
			logger.info('Deleted book from Firestore');
			return true;
		},
	);
}

////////////////////////////////////////////////////////////////////////////////

export let Firestore = {
	getBooks,
	getBook,
	createBook,
	updateBook,
	deleteBook,
};
