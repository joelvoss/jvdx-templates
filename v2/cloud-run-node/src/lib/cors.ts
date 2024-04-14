import type { MiddlewareHandler } from 'hono';

type Origin =
	| boolean
	| string
	| string[]
	| RegExp
	| ((origin: string) => boolean);

type CORSOptions = {
	origin?: Origin;
	allowMethods?: string[];
	allowHeaders?: string[];
	maxAge?: number;
	credentials?: boolean;
	exposeHeaders?: string[];
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Check if the origin is allowed.
 */
function isOriginAllowed(origin: string, allowedOrigin: Origin) {
	if (Array.isArray(allowedOrigin)) {
		for (let i = 0; i < allowedOrigin.length; ++i) {
			if (isOriginAllowed(origin, allowedOrigin[i])) {
				return true;
			}
		}
		return false;
	} else if (typeof allowedOrigin === 'string') {
		return origin === allowedOrigin;
	} else if (typeof allowedOrigin === 'function') {
		return allowedOrigin(origin);
	} else if (allowedOrigin instanceof RegExp) {
		return allowedOrigin.test(origin);
	} else {
		return !!allowedOrigin;
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * CORS middleware.
 */
export function cors(options?: CORSOptions): MiddlewareHandler {
	let opts = {
		origin: '*',
		allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
		allowHeaders: [],
		exposeHeaders: [],
		...options,
	};

	return async function (c, next) {
		if (!opts.origin || opts.origin === '*') {
			c.res.headers.set('Access-Control-Allow-Origin', '*');
		} else if (typeof opts.origin === 'string') {
			c.res.headers.set('Access-Control-Allow-Origin', opts.origin);
			c.res.headers.set('Vary', 'Origin');
		} else {
			let requestOrigin = c.req.header('origin') || '';
			let isAllowed = isOriginAllowed(requestOrigin, opts.origin);
			if (isAllowed) {
				c.res.headers.set('Access-Control-Allow-Origin', requestOrigin);
				c.res.headers.set('Vary', 'Origin');
			}
		}

		if (opts.credentials) {
			c.res.headers.set('Access-Control-Allow-Credentials', 'true');
		}

		if (opts.exposeHeaders?.length) {
			c.res.headers.set(
				'Access-Control-Expose-Headers',
				opts.exposeHeaders.join(','),
			);
		}

		if (c.req.method === 'OPTIONS') {
			if (opts.maxAge != null) {
				c.res.headers.set('Access-Control-Max-Age', opts.maxAge.toString());
			}

			if (opts.allowMethods?.length) {
				c.res.headers.set(
					'Access-Control-Allow-Methods',
					opts.allowMethods.join(','),
				);
			}

			let headers = opts.allowHeaders;
			if (!headers?.length) {
				let requestHeaders = c.req.header('Access-Control-Request-Headers');
				if (requestHeaders) {
					headers = requestHeaders.split(/\s*,\s*/);
				}
			}
			if (headers?.length) {
				c.res.headers.set('Access-Control-Allow-Headers', headers.join(','));
				c.res.headers.append('Vary', 'Access-Control-Request-Headers');
			}

			c.res.headers.delete('Content-Length');
			c.res.headers.delete('Content-Type');

			return new Response(null, {
				headers: c.res.headers,
				status: 204,
				statusText: c.res.statusText,
			});
		}
		await next();
	};
}
