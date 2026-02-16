import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

import { deleteBook, DeleteBookSchema } from "~/adapter/firestore";

////////////////////////////////////////////////////////////////////////////////

/**
 * Server function to fetch a single book by its ID.
 */
export const deleteBookFn = createServerFn({ method: "POST" })
	.inputValidator(DeleteBookSchema)
	.handler(({ data }) => {
		return deleteBook(data);
	});

/**
 * Query options for fetching a single book by ID
 */
export const deleteBookMutationOpts = (
	data: v.InferInput<typeof DeleteBookSchema>,
) =>
	mutationOptions({
		mutationFn: () => deleteBookFn({ data }),
		// NOTE(joel): Await the "books" query to be refetched after a book is
		// deleted.
		meta: {
			awaits: [["books"]],
		},
	});
