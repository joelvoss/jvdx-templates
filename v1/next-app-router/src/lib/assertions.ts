/**
 * isNonNull checks if a given value is non nullable.
 */
export function isNonNull<T = any>(val: T): val is NonNullable<T> {
	return !(val == null);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * isArray checks if a given value is an array.
 */
export function isArray(val: any): val is Array<typeof val> {
	return Array.isArray(val);
}
////////////////////////////////////////////////////////////////////////////////

/**
 * isString checks if a given value is a string.
 */
export function isString(val: any): val is string {
	return {}.toString.call(val) === '[object String]';
}

////////////////////////////////////////////////////////////////////////////////

/**
 * isObject checks if a given value is an object.
 */
export function isObject(val: any): val is Object {
	return !!(val && {}.toString.call(val) === '[object Object]');
}

////////////////////////////////////////////////////////////////////////////////

/**
 * isFunction checks if a given value is a function.
 */
export function isFunction(val: any): val is Function {
	return !!(
		val &&
		({}.toString.call(val) === '[object Function]' ||
			{}.toString.call(val) === '[object AsyncFunction]')
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * isDate checks if a given value is a string.
 */
export function isDate(val: any): val is Date {
	return !!(val && {}.toString.call(val) == '[object Date]');
}

////////////////////////////////////////////////////////////////////////////////

/**
 * isRegExp checks if a given value is a RegExp.
 */
export function isRegExp(val: any): val is RegExp {
	return !!(val && {}.toString.call(val) == '[object RegExp]');
}
