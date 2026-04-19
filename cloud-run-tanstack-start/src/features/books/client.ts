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

export const booksQueryOptions = (data: v.InferInput<typeof GetBooksSchema>) =>
	queryOptions({
		queryKey: ["books", data.sort],
		queryFn: () => getBooks({ data }),
	});

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

interface CreateBookMutationPayload {
	onSuccess?: () => void;
}

interface CreateBookMutationError {
	issues: v.FlatErrors<typeof CreateBookSchema>;
}

export const createBookMutationOpts = (payload: CreateBookMutationPayload) =>
	mutationOptions<unknown, CreateBookMutationError, FormData>({
		mutationFn: async (fd) => {
			const headers = getMutationHeaders();
			const data = validateFormData(CreateBookSchema, fd, { keepEmpty: false });

			try {
				return await createBook({ data, headers });
			} catch (error: unknown) {
				throw toMutationError(CreateBookSchema, error, { rootFallback: true });
			}
		},
		onSuccess: payload.onSuccess,
		meta: {
			awaits: [["books"]],
		},
	});

////////////////////////////////////////////////////////////////////////////////

interface UpdateBookMutationPayload {
	id: v.InferInput<typeof UpdateBookSchema>["id"];
	onSuccess?: () => void;
}

interface UpdateBookMutationError {
	issues: v.FlatErrors<typeof UpdateBookSchema>;
}

export const updateBookMutationOpts = (payload: UpdateBookMutationPayload) =>
	mutationOptions<unknown, UpdateBookMutationError, FormData>({
		mutationFn: async (fd) => {
			const headers = getMutationHeaders();
			const data = validateFormData(UpdateBookSchema, fd, { keepEmpty: true });

			try {
				return await updateBook({ data, headers });
			} catch (error: unknown) {
				throw toMutationError(UpdateBookSchema, error);
			}
		},
		onSuccess: payload.onSuccess,
		meta: {
			awaits: [["book", payload.id], ["books"]],
		},
	});

////////////////////////////////////////////////////////////////////////////////

export const deleteBookMutationOpts = (
	data: v.InferInput<typeof DeleteBookSchema>,
) =>
	mutationOptions({
		mutationFn: () => deleteBook({ data, headers: getMutationHeaders() }),
		meta: {
			awaits: [["books"]],
			invalidates: [["book", data.id]],
		},
	});

////////////////////////////////////////////////////////////////////////////////

function getMutationHeaders() {
	if (typeof document === "undefined") return undefined;

	const csrfToken = readCookie(document.cookie, csrfCookieName);
	return csrfToken ? { [csrfHeaderName]: csrfToken } : undefined;
}
