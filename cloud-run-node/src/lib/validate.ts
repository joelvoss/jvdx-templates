import * as v from 'valibot';

import { HTTPException } from '~/lib/http-exception';

////////////////////////////////////////////////////////////////////////////////

/**
 * Validates a value against a valibot schema. Throws an HTTPException with
 * a 400 status code if validation fails.
 */
export function validate<T>(
	schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
	value: unknown,
): T {
	let result = v.safeParse(schema, value);
	if (result.success) return result.output;
	let flat = v.flatten(result.issues);
	let messages =
		flat.root ??
		Object.values(flat.nested ?? {})
			.flat()
			.filter(Boolean);
	let message = (messages as string[]).join(', ') || 'Invalid request body';
	throw new HTTPException(400, { code: 'VALIDATION_ERROR', message });
}
