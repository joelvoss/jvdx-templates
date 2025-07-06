import type { ParsedUrlQuery } from 'node:querystring';
import type { UrlObject } from 'node:url';

////////////////////////////////////////////////////////////////////////////////

const SLASHED_PROTOCOLS = /https?|ftp|gopher|file/;

/**
 * Formats a URL object into a string.
 * Source: https://github.com/vercel/next.js/blob/canary/packages/next/src/shared/lib/router/utils/format-url.ts
 */
export function formatUrl(urlObj: UrlObject) {
	let { auth, hostname } = urlObj;
	let protocol = urlObj.protocol || '';
	let pathname = urlObj.pathname || '';
	let hash = urlObj.hash || '';
	let query = urlObj.query || '';
	let host: string | false = false;

	auth = auth ? `${encodeURIComponent(auth).replace(/%3A/i, ':')}@` : '';

	if (urlObj.host) {
		host = auth + urlObj.host;
	} else if (hostname) {
		host = auth + (~hostname.indexOf(':') ? `[${hostname}]` : hostname);
		if (urlObj.port) {
			host += `:${urlObj.port}`;
		}
	}

	if (query && typeof query === 'object') {
		query = String(urlQueryToSearchParams(query as ParsedUrlQuery));
	}

	let search = urlObj.search || (query && `?${query}`) || '';

	if (protocol && !protocol.endsWith(':')) protocol += ':';

	if (
		urlObj.slashes ||
		((!protocol || SLASHED_PROTOCOLS.test(protocol)) && host !== false)
	) {
		host = `//${host || ''}`;
		if (pathname && pathname[0] !== '/') pathname = `/${pathname}`;
	} else if (!host) {
		host = '';
	}

	if (hash && hash[0] !== '#') hash = `#${hash}`;
	if (search && search[0] !== '?') search = `?${search}`;

	pathname = pathname.replace(/[?#]/g, encodeURIComponent);
	search = search.replace('#', '%23');

	return `${protocol}${host}${pathname}${search}${hash}`;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Converts a URL query string into an object.
 * Source: https://github.com/vercel/next.js/blob/canary/packages/next/src/shared/lib/router/utils/querystring.ts
 */
function urlQueryToSearchParams(urlQuery: ParsedUrlQuery): URLSearchParams {
	const result = new URLSearchParams();

	for (const [key, value] of Object.entries(urlQuery)) {
		if (Array.isArray(value)) {
			for (const item of value) {
				result.append(key, stringifyUrlQueryParam(item));
			}
		} else {
			result.set(key, stringifyUrlQueryParam(value));
		}
	}
	return result;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Stringifies a URL query parameter.
 * Source: https://github.com/vercel/next.js/blob/canary/packages/next/src/shared/lib/router/utils/querystring.ts
 */
function stringifyUrlQueryParam(param: unknown): string {
	if (
		typeof param === 'string' ||
		(typeof param === 'number' && !Number.isNaN(param)) ||
		typeof param === 'boolean'
	) {
		return String(param);
	}
	return '';
}
