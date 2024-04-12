/**
 * isNonNull checks if a given value is non nullable.
 */
export function isNonNull<T = any>(val: T): val is NonNullable<T> {
	return !(val == null);
}
