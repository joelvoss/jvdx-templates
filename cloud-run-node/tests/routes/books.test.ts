import { Hono } from 'hono';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HTTPException } from '~/lib/http-exception';

////////////////////////////////////////////////////////////////////////////////
// Mocks

let mockGetBooks = vi.fn();
let mockCreateBook = vi.fn();
let mockGetBook = vi.fn();
let mockUpdateBook = vi.fn();
let mockDeleteBook = vi.fn();

vi.mock('~/adapters/firestore', () => {
	return {
		Firestore: {
			getBooks: mockGetBooks,
			createBook: mockCreateBook,
			getBook: mockGetBook,
			updateBook: mockUpdateBook,
			deleteBook: mockDeleteBook,
		},
	};
});

////////////////////////////////////////////////////////////////////////////////

async function createApp() {
	let { books } = await import('~/routes/books');
	let app = new Hono();

	app.onError((err, c) => {
		if (err instanceof HTTPException) return err.getResponse();
		return c.json({ message: err.message }, 500);
	});

	app.route('/v1/books', books);

	return app;
}

////////////////////////////////////////////////////////////////////////////////

describe('books routes', () => {
	let app: Hono;

	beforeEach(async () => {
		vi.resetAllMocks();
		app = await createApp();
	});

	test('GET /v1/books returns all books with total count and cache headers', async () => {
		let books = [
			{ id: '1', title: 'The Pragmatic Programmer', author: 'Andy Hunt' },
			{ id: '2', title: 'Clean Code', author: 'Robert C. Martin' },
		];

		mockGetBooks.mockResolvedValueOnce(books);

		let response = await app.request('/v1/books');

		expect(response.status).toBe(200);
		expect(mockGetBooks).toHaveBeenCalledTimes(1);
		expect(response.headers.get('Cache-Control')).toBe(
			'public, max-age=300, s-maxage=600, stale-while-revalidate',
		);

		let body = await response.json();
		expect(body).toEqual({ books, total: books.length });
	});

	test('GET /v1/books/:id returns the requested book when it exists', async () => {
		let book = {
			id: 'book-123',
			title: 'Test Driven Development',
			author: 'Kent Beck',
		};

		mockGetBook.mockResolvedValueOnce(book);

		let response = await app.request('/v1/books/book-123');

		expect(response.status).toBe(200);
		expect(mockGetBook).toHaveBeenCalledWith({ id: 'book-123' });

		let body = await response.json();
		expect(body).toEqual(book);
	});

	test('GET /v1/books/:id returns 404 when the book does not exist', async () => {
		mockGetBook.mockResolvedValueOnce(null);

		let response = await app.request('/v1/books/missing');

		expect(response.status).toBe(404);

		let body = await response.json();
		expect(body).toEqual({
			code: 'NOT_FOUND',
			message: "Book with ID 'missing' not found",
		});
	});

	test('POST /v1/books creates a book when payload is valid', async () => {
		mockCreateBook.mockResolvedValueOnce(true);

		let payload = { title: 'New Book', author: 'New Author' };
		let response = await app.request('/v1/books', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload),
		});

		expect(response.status).toBe(200);
		expect(mockCreateBook).toHaveBeenCalledWith(payload);

		let body = await response.json();
		expect(body).toEqual({ message: 'ok' });
	});

	test('POST /v1/books returns a validation error for invalid payloads', async () => {
		let response = await app.request('/v1/books', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ title: 'Incomplete Book' }),
		});

		expect(response.status).toBe(400);
		expect(mockCreateBook).not.toHaveBeenCalled();

		let body = await response.json();
		expect(body.code).toBe('VALIDATION_ERROR');
		expect(body.message.author).toBeDefined();
	});

	test('POST /v1/books/:id updates a book when payload is valid', async () => {
		mockUpdateBook.mockResolvedValueOnce(true);

		let payload = { title: 'Updated Title', author: 'Updated Author' };
		let response = await app.request('/v1/books/book-123', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload),
		});

		expect(response.status).toBe(200);
		expect(mockUpdateBook).toHaveBeenCalledWith({ id: 'book-123', ...payload });

		let body = await response.json();
		expect(body).toEqual({ message: 'ok' });
	});

	test('POST /v1/books/:id returns 404 when the book update fails with code 5', async () => {
		mockUpdateBook.mockRejectedValueOnce({ code: 5 });

		let response = await app.request('/v1/books/book-404', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ title: 'Updated Title' }),
		});

		expect(response.status).toBe(404);

		let body = await response.json();
		expect(body).toEqual({
			code: 'NOT_FOUND',
			message:
				'Error updating book. Reason: "Book with ID \'book-404\' not found"',
		});
	});

	test('DELETE /v1/books/:id deletes a book and returns ok', async () => {
		mockDeleteBook.mockResolvedValueOnce(true);

		let response = await app.request('/v1/books/book-123', {
			method: 'DELETE',
		});

		expect(response.status).toBe(200);
		expect(mockDeleteBook).toHaveBeenCalledWith({ id: 'book-123' });

		let body = await response.json();
		expect(body).toEqual({ message: 'ok' });
	});
});
