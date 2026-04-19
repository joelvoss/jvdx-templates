import * as v from "valibot";

////////////////////////////////////////////////////////////////////////////////

/**
 * Validates FormData against a Valibot schema.
 * Trims string values and optionally removes empty fields before validation.
 * Throws an error with flattened issues if validation fails.
 */
export function validateFormData<
	const TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(
	schema: TSchema,
	fd: FormData,
	opts: { keepEmpty: boolean },
): v.InferOutput<TSchema> {
	const result = v.safeParse(schema, parseFormData(fd, opts));
	if (result.success) return result.output;
	throw { issues: v.flatten<TSchema>(result.issues) };
}

export function toMutationError<
	const TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(_schema: TSchema, error: unknown, opts?: { rootFallback?: boolean }) {
	const issues = parseSchemaIssues<TSchema>(error);
	if (issues) return { issues };
	if (opts?.rootFallback) {
		return { issues: { root: [getErrorMessage(error)] } };
	}
	throw error;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Parses FormData into a plain object, trimming string values and optionally
 * removing empty fields. Only string values are included in the output object.
 */
function parseFormData(
	fd: FormData,
	opts: { keepEmpty: boolean },
): Record<string, string> {
	const data: Record<string, string> = {};
	for (const [key, value] of fd) {
		if (typeof value !== "string") continue;
		const trimmed = value.trim();
		if (trimmed !== "" || opts.keepEmpty) data[key] = trimmed;
	}
	return data;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Attempts to parse an error message as JSON and flatten it using Valibot. If
 * parsing fails, returns null.
 */
function parseSchemaIssues<
	const TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(error: unknown) {
	try {
		return v.flatten<TSchema>(JSON.parse(getErrorMessage(error)));
	} catch {
		return null;
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts a readable error message from an unknown error object. If the error
 * is an instance of Error, it returns the message property; otherwise, it
 * converts the error to a string.
 */
function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}
