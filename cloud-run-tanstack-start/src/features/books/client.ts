import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import * as v from "valibot";

import {
	CreateBookSchema,
	DeleteBookSchema,
	GetBookSchema,
	GetBooksSchema,
	UpdateBookSchema,
} from "~/features/books/schema";
import {
	createBook,
	deleteBook,
	getBook,
	getBooks,
	updateBook,
} from "~/features/books/server";
import { csrfCookieName, csrfHeaderName, readCookie } from "~/lib/cookies";
import { toMutationError, validateFormData } from "~/lib/valibot";

////////////////////////////////////////////////////////////////////////////////
// Query Options

/**
 * Query options for fetching the list of books, optionally sorted by title,
 * author, or published year.
 */
export const booksQueryOptions = (data: v.InferInput<typeof GetBooksSchema>) =>
	queryOptions({
		queryKey: ["books", data.sort],
		queryFn: () => getBooks({ data }),
	});

/**
 * Query options for fetching a single book by ID. If the book does not exist,
 * this will throw a 404 error which can be handled by the caller.
 */
export const bookQueryOptions = (data: v.InferInput<typeof GetBookSchema>) =>
	queryOptions({
		queryKey: ["book", data.id],
		queryFn: async () => {
			const book = await getBook({ data });
			if (!book) throw notFound();
			return book;
		},
	});

////////////////////////////////////////////////////////////////////////////////
// Mutation Options

/**
 * Mutation options for creating a new book.
 */
export const createBookMutationOpts = () =>
	mutationOptions<
		Awaited<ReturnType<typeof createBook>>,
		{ issues: v.FlatErrors<typeof CreateBookSchema> },
		FormData
	>({
		mutationFn: (payload) => {
			const headers = getMutationHeaders();
			const data = validateFormData(CreateBookSchema, payload, {
				keepEmpty: false,
			});

			try {
				return createBook({ data, headers });
			} catch (error: unknown) {
				throw toMutationError(CreateBookSchema, error, { rootFallback: true });
			}
		},
		meta: {
			awaits: [["books"]],
		},
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Mutation options for updating a book.
 */
export const updateBookMutationOpts = (
	data: v.InferInput<typeof UpdateBookSchema>,
) =>
	mutationOptions<
		Awaited<ReturnType<typeof updateBook>>,
		{ issues: v.FlatErrors<typeof UpdateBookSchema> },
		FormData
	>({
		mutationFn: (payload) => {
			const headers = getMutationHeaders();
			const data = validateFormData(UpdateBookSchema, payload, {
				keepEmpty: true,
			});

			try {
				return updateBook({ data, headers });
			} catch (error: unknown) {
				throw toMutationError(UpdateBookSchema, error);
			}
		},
		meta: {
			awaits: [["books"], ["book", data.id]],
		},
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Mutation options for deleting a book.
 */
export const deleteBookMutationOpts = (
	data: v.InferInput<typeof DeleteBookSchema>,
) =>
	mutationOptions<
		Awaited<ReturnType<typeof deleteBook>>,
		{ issues: v.FlatErrors<typeof DeleteBookSchema> }
	>({
		mutationFn: () => deleteBook({ data, headers: getMutationHeaders() }),
		meta: {
			awaits: [["books"]],
			invalidates: [["book", data.id]],
		},
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Helper function to get mutation headers, including CSRF token if available.
 */
function getMutationHeaders() {
	if (typeof document === "undefined") return undefined;

	const csrfToken = readCookie(document.cookie, csrfCookieName);
	return csrfToken ? { [csrfHeaderName]: csrfToken } : undefined;
}
