import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

import { createBook, CreateBookSchema } from "~/adapter/firestore";

////////////////////////////////////////////////////////////////////////////////

/**
 * Server function to update a single book by its ID.
 */
export const createBookFn = createServerFn({ method: "POST" })
	.inputValidator(CreateBookSchema)
	.handler(({ data }) => {
		return createBook(data);
	});

////////////////////////////////////////////////////////////////////////////////

interface CreateMutationOptsPayload {
	onSuccess?: () => void;
}

interface CreateBookError {
	issues: v.FlatErrors<typeof CreateBookSchema>;
}

/**
 * Mutation options for creating a single book
 */
export const createBookMutationOpts = (payload: CreateMutationOptsPayload) =>
	// NOTE(joel): Explicit generic types are required to properly infer the
	// error type: `mutationOptions<TData, TError, TVariables, TOnMutateResult>`
	mutationOptions<unknown, CreateBookError, FormData>({
		mutationFn: async (fd) => {
			// NOTE(joel): Parse and validate FormData eagerly before sending to the
			// server. This way we can provide immediate feedback to the user without
			// waiting for a server roundtrip.
			// FormData values are always strings with empty strings for missing
			// fields, so we filter out empty values and validate with Valibot
			// client-side first.
			const data: Record<string, string> = {};
			for (const [key, value] of fd) {
				if (typeof value !== "string") continue;
				const trimmed = value.trim();
				if (trimmed !== "") data[key] = trimmed;
			}
			const result = v.safeParse(CreateBookSchema, data);
			if (!result.success) {
				return Promise.reject({
					issues: v.flatten<typeof CreateBookSchema>(result.issues),
				});
			}

			// NOTE(joel): Call the server function to update the book. If for some
			// reason the server returns validation errors, we catch and parse
			// them here to return a structured error object.
			try {
				return await createBookFn({ data: result.output });
			} catch (error: any) {
				try {
					const parsed = JSON.parse(error.message);
					return Promise.reject({
						issues: v.flatten<typeof CreateBookSchema>(parsed),
					});
				} catch {
					return Promise.reject({
						issues: { root: [error.message] },
					});
				}
			}
		},
		onSuccess: payload.onSuccess,
		meta: {
			awaits: [["books"]],
		},
	});
