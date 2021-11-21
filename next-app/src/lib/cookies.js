/**
 * @typedef {Object} CookieOptions
 * @prop {Function} encode
 * @prop {number} maxAge
 * @prop {string} domain
 * @prop {string} path
 * @prop {Date|string} expires
 * @prop {boolean} httpOnly
 * @prop {boolean} secure
 * @prop {true|'lax'|'strict'|'none'} sameSite
 */

/**
 * setCookie sets a cookie server side.
 * Credit to https://github.com/jshttp/cookie/blob/master/index.js and
 * https://github.com/zeit/next.js/blob/master/examples/api-routes-middleware/utils/cookies.js
 * @param {Response} res
 * @param {string} name
 * @param {any} value
 * @param {CookieOptions} [options={}]
 */
export function setCookie(res, name, value, options = {}) {
	const stringValue =
		typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

	if ('maxAge' in options) {
		options.expires = new Date(Date.now() + options.maxAge);
		options.maxAge /= 1000;
	}

	// NOTE(joel): Preserve any existing cookies that have already been set in
	// the same session.
	let setCookieHeader = res.getHeader('Set-Cookie') || [];
	if (!Array.isArray(setCookieHeader)) {
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
 * @param {string} name
 * @param {string} val
 * @param {CookieOptions} [options={}]
 */
function serialize(name, val, options = {}) {
	const enc = options.encode || encodeURIComponent;

	if (typeof enc !== 'function') {
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

	if (options.maxAge != null) {
		const maxAge = options.maxAge - 0;

		if (isNaN(maxAge) || !isFinite(maxAge)) {
			throw new TypeError('"option.maxAge" is invalid');
		}

		str += '; Max-Age=' + Math.floor(maxAge);
	}

	if (options.domain) {
		if (!fieldContentRegExp.test(options.domain)) {
			throw new TypeError('"option.domain" is invalid');
		}

		str += '; Domain=' + options.domain;
	}

	if (options.path) {
		if (!fieldContentRegExp.test(options.path)) {
			throw new TypeError('"option.path" is invalid');
		}

		str += '; Path=' + options.path;
	} else {
		str += '; Path=/';
	}

	if (options.expires) {
		let expires = options.expires;
		if (typeof options.expires.toUTCString === 'function') {
			expires = options.expires.toUTCString();
		} else {
			const dateExpires = new Date(options.expires);
			expires = dateExpires.toUTCString();
		}
		str += '; Expires=' + expires;
	}

	if (options.httpOnly) {
		str += '; HttpOnly';
	}

	if (options.secure) {
		str += '; Secure';
	}

	if (options.sameSite) {
		const sameSite =
			typeof options.sameSite === 'string'
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
