import {
	isArray,
	isDate,
	isFunction,
	isNonNull,
	isObject,
	isString,
} from '@/lib/assertions';

import type { ServerResponse } from 'http';

type CookieOptions = {
	maxAge?: number;
	expires?: Date | string;
	encode?: (uriComponent: string | number | boolean) => string;
	domain?: string;
	path?: string;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: boolean | 'lax' | 'strict' | 'none';
};

/**
 * setCookie sets a cookie server side.
 * Credit to https://github.com/jshttp/cookie/blob/master/index.js and
 * https://github.com/zeit/next.js/blob/master/examples/api-routes-middleware/utils/cookies.js
 */
export function setCookie(
	res: ServerResponse,
	name: string,
	value: any,
	options: CookieOptions = {},
) {
	const stringValue = isObject(value)
		? 'j:' + JSON.stringify(value)
		: String(value);

	if (isNonNull(options.maxAge)) {
		options.expires = new Date(Date.now() + options.maxAge * 1000);
		options.maxAge /= 1000;
	}

	// NOTE(joel): Preserve any existing cookies that have already been set in
	// the same session.
	let setCookieHeader =
		(res.getHeader('Set-Cookie') as string | string[]) || [];
	if (!isArray(setCookieHeader)) {
		setCookieHeader = [setCookieHeader];
	}

	setCookieHeader.push(serialize(name, String(stringValue), options));
	res.setHeader('Set-Cookie', setCookieHeader);
}

////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line no-control-regex
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * serialize creates a serialized cookie string.
 */
function serialize(name: string, val: string, options: CookieOptions = {}) {
	const enc = options.encode || encodeURIComponent;

	if (!isFunction(enc)) {
		throw new TypeError('"option.encode" is invalid');
	}

	if (!fieldContentRegExp.test(name)) {
		throw new TypeError('"name" is invalid');
	}

	const value = enc(val);

	if (value && !fieldContentRegExp.test(value)) {
		throw new TypeError('"val" is invalid');
	}

	let str = name + '=' + value;

	if (isNonNull(options.maxAge)) {
		const maxAge = options.maxAge - 0;

		if (isNaN(maxAge) || !isFinite(maxAge)) {
			throw new TypeError('"option.maxAge" is invalid');
		}

		str += '; Max-Age=' + Math.floor(maxAge);
	}

	if (isNonNull(options.domain)) {
		if (!fieldContentRegExp.test(options.domain)) {
			throw new TypeError('"option.domain" is invalid');
		}

		str += '; Domain=' + options.domain;
	}

	if (isNonNull(options.path)) {
		if (!fieldContentRegExp.test(options.path)) {
			throw new TypeError('"option.path" is invalid');
		}

		str += '; Path=' + options.path;
	} else {
		str += '; Path=/';
	}

	if (isNonNull(options.expires)) {
		let expires = options.expires;
		if (isDate(options.expires)) {
			expires = options.expires.toUTCString();
		} else {
			const dateExpires = new Date(options.expires);
			expires = dateExpires.toUTCString();
		}
		str += '; Expires=' + expires;
	}

	if (isNonNull(options.httpOnly)) {
		str += '; HttpOnly';
	}

	if (options.secure) {
		str += '; Secure';
	}

	if (isNonNull(options.sameSite)) {
		const sameSite = isString(options.sameSite)
			? options.sameSite.toLowerCase()
			: options.sameSite;

		switch (sameSite) {
			case true:
				str += '; SameSite=Strict';
				break;
			case 'lax':
				str += '; SameSite=Lax';
				break;
			case 'strict':
				str += '; SameSite=Strict';
				break;
			case 'none':
				str += '; SameSite=None';
				break;
			default:
				throw new TypeError('"option.sameSite" is invalid');
		}
	}

	return str;
}
