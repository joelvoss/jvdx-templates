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
	return !!(val && {}.toString.call(val) === '[object Function]');
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

////////////////////////////////////////////////////////////////////////////////

/**
 * isHtmlElement checks if a given object is a HTML element.
 */
export function isHtmlElement(val: any): val is HTMLElement {
	return val != null && typeof val.tagName === 'string';
}

/**
 * isButtonElement checks if a given object is a <button> element.
 */
export function isButtonElement(val: any): val is HTMLButtonElement {
	return isHtmlElement(val) && val.tagName.toLowerCase() === 'button';
}

/**
 * isFormElement checks if a given object is a <form> element.
 */
export function isFormElement(val: any): val is HTMLFormElement {
	return isHtmlElement(val) && val.tagName.toLowerCase() === 'form';
}

/**
 * isInputElement checks if a given object is a <input> element.
 */
export function isInputElement(val: any): val is HTMLInputElement {
	return isHtmlElement(val) && val.tagName.toLowerCase() === 'input';
}

////////////////////////////////////////////////////////////////////////////////

/**
 * isEqual checks if two sets of arguments are the same after stringifying.
 */
export function isEqual<NewArgs = any, LastArgs = any>(
	newArgs: NewArgs[],
	lastArgs: LastArgs[],
) {
	// No checks needed if the inputs length has changed
	if (newArgs.length !== lastArgs.length) {
		return false;
	}

	try {
		const strNewArgs = JSON.stringify(newArgs);
		const strLastArgs = JSON.stringify(lastArgs);
		if (strNewArgs !== strLastArgs) {
			return false;
		}
	} catch (e) {
		return false;
	}
	return true;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * isOriginAllowed checks if a given origin is allowed. It follows the CORS
 * option signature.
 * @see https://github.com/expressjs/cors#configuration-options
 */
export function isOriginAllowed(
	origin: string | undefined,
	allowedOrigin: Array<string | RegExp> | string | RegExp | boolean | undefined,
) {
	if (!isNonNull(origin)) return false;

	if (isArray(allowedOrigin)) {
		for (let i = 0; i < allowedOrigin.length; ++i) {
			if (isOriginAllowed(origin, allowedOrigin[i])) {
				return true;
			}
		}
		return false;
	} else if (isString(allowedOrigin)) {
		return origin === allowedOrigin;
	} else if (isRegExp(allowedOrigin)) {
		return allowedOrigin.test(origin);
	}
	return !!allowedOrigin;
}
