/**
 * A utility for conditionally joining classNames together.
 * Inspired by the popular `clsx` library.
 */
export function clsx(...args: ClassValue[]): string {
	let str = "";
	for (let i = 0; i < args.length; i++) {
		const tmp = args[i];
		if (!tmp) continue;

		const x = toVal(tmp);
		if (x.length === 0) continue;

		if (str) str += " ";
		str += x;
	}
	return str;
}

////////////////////////////////////////////////////////////////////////////////

export type ClassValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| ClassArray
	| ClassObject;
type ClassArray = ClassValue[];
type ClassObject = { [key: string]: unknown };

/**
 * Converts a ClassValue to a string.
 * Handles strings, numbers, arrays, and objects.
 */
function toVal(input: ClassValue): string {
	let str = "";

	// NOTE(joel): Stringify numbers and strings
	if (typeof input === "string" || typeof input === "number") {
		str += input;
		return str;
	}

	// NOTE(joel): Handle arrays and objects (both of type 'object'). If 'input'
	// is null, we skip it here and return an empty string later.
	if (typeof input === "object" && input != null) {
		if (Array.isArray(input)) {
			for (let k = 0; k < input.length; k++) {
				if (!input[k]) continue;
				const y = toVal(input[k]);
				if (y.length === 0) continue;
				if (str) str += " ";
				str += y;
			}
			return str;
		}

		for (const y in input) {
			if (!input[y]) continue;
			if (str) str += " ";
			str += y;
		}
	}

	return str;
}
