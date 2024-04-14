import type { MiddlewareHandler } from 'hono';

type CacheControlOptions =
	| {
			maxAge?: number;
			sMaxAge?: number;
	  }
	| boolean;

////////////////////////////////////////////////////////////////////////////////
/**
 * Sets the Cache-Control header for the response.
 */
export function cacheControl(
	options: CacheControlOptions = {},
): MiddlewareHandler {
	return async function (c, next) {
		if (process.env.NODE_ENV === 'development') options = false;

		if (typeof options === 'boolean') {
			if (!options) {
				c.res.headers.set(
					'Cache-Control',
					'no-cache, no-store, must-revalidate',
				);
				await next();
				return;
			}
			options = {};
		}

		let { maxAge = 300, sMaxAge = 600 } = options;
		c.res.headers.set(
			'Cache-Control',
			`public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate`,
		);
		await next();
	};
}
