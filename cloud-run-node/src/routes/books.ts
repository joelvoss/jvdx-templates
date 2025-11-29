import { Hono } from 'hono';
import { validator } from 'hono/validator';
import * as v from 'valibot';
import { Firestore } from '~/adapters/firestore';
import { cacheControl } from '~/lib/cache-control';
import { HTTPException } from '~/lib/http-exception';
import type { Variables } from '~/types';

////////////////////////////////////////////////////////////////////////////////

export let books = new Hono<{ Variables: Variables }>();

// NOTE(joel): GET /v1/books
// Get all books from the 'books' collection.
books.get('/', cacheControl(), async c => {
	let books = await Firestore.getBooks();
	let total = books.length;
	return c.json({ books, total });
});

////////////////////////////////////////////////////////////////////////////////

let CreateBookSchema = v.object({
	title: v.string(),
	author: v.string(),
});

// NOTE(joel): POST /v1/books
// Create a new book in the 'books' collection.
books.post(
	'/',
	validator('json', (value, c) => {
		let result = v.safeParse(CreateBookSchema, value);
		if (result.success) return result.output;
		let flattend = v.flatten(result.issues);
		return c.json({ code: 'VALIDATION_ERROR', message: flattend.nested }, 400);
	}),
	async c => {
		let { title, author } = c.req.valid('json');
		await Firestore.createBook({ title, author });
		return c.json({ message: 'ok' });
	},
);

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): GET /v1/books/:id
// Get a book from the 'books' collection by its ID.
// If the book does not exist, return a 404 Not Found.
books.get('/:id', cacheControl(), async c => {
	let id = c.req.param('id');
	let book = await Firestore.getBook({ id });
	if (!book) {
		throw new HTTPException(404, {
			code: 'NOT_FOUND',
			message: `Book with ID '${id}' not found`,
		});
	}
	return c.json(book);
});

////////////////////////////////////////////////////////////////////////////////

let UpdateBookSchema = v.object({
	title: v.optional(v.string()),
	author: v.optional(v.string()),
});

// NOTE(joel): POST /v1/books/:id
// Update a book in the 'books' collection by its ID.
// If the book does not exist, return a 404 Not Found.
books.post(
	'/:id',
	validator('json', (value, c) => {
		let result = v.safeParse(UpdateBookSchema, value);
		if (result.success) return result.output;
		let flattend = v.flatten(result.issues);
		return c.json({ code: 'VALIDATION_ERROR', message: flattend.nested }, 400);
	}),
	async c => {
		let id = c.req.param('id');
		let { title, author } = c.req.valid('json');
		try {
			await Firestore.updateBook({ id, title, author });
		} catch (err: unknown) {
			// @ts-expect-error Unknown type
			if (err.code === 5) {
				throw new HTTPException(404, {
					code: 'NOT_FOUND',
					message: `Error updating book. Reason: "Book with ID '${id}' not found"`,
				});
			}
		}
		return c.json({ message: 'ok' });
	},
);

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): DELETE /v1/books/:id
// Delete a book from the 'books' collection by its ID.
// If the book does not exist, do nothing but return a 200 OK.
books.delete('/:id', async c => {
	let id = c.req.param('id');
	await Firestore.deleteBook({ id });
	return c.json({ message: 'ok' });
});
