import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

import { getBooks, GetBooksSchema } from "~/adapter/firestore";

////////////////////////////////////////////////////////////////////////////////

/**
 * Server function to fetch all books, optionally sorted.
 */
export const getBooksFn = createServerFn({ method: "GET" })
	.inputValidator(GetBooksSchema)
	.handler(async ({ data }) => {
		const books = await getBooks(data);
		return books;
	});

/**
 * Query options for fetching all books, optionally sorted.
 */
export const booksQueryOptions = (data: v.InferInput<typeof GetBooksSchema>) =>
	queryOptions({
		queryKey: ["books", data.sort],
		queryFn: () => getBooksFn({ data }),
	});
