import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

import { getBook, GetBookSchema } from "~/adapter/firestore";

////////////////////////////////////////////////////////////////////////////////

/**
 * Server function to fetch a single book by its ID.
 */
export const getBookFn = createServerFn({ method: "GET" })
	.inputValidator(GetBookSchema)
	.handler(async ({ data }) => {
		const book = await getBook(data);
		if (!book) {
			throw notFound();
		}
		return book;
	});

/**
 * Query options for fetching a single book by ID
 */
export const bookQueryOptions = (data: v.InferInput<typeof GetBookSchema>) =>
	queryOptions({
		queryKey: ["book", data.id],
		queryFn: () => getBookFn({ data }),
	});
