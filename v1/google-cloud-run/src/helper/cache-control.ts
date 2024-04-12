import type { Request, Response, NextFunction, RequestHandler } from 'express';

type CacheControlOptions = {
	enabled?: boolean;
	maxAge?: number;
	sMaxAge?: number;
};

/**
 * cacheControl is an Express middleware to simplify setting `Cache-Control`
 * headers.
 */
export function cacheControl({
	enabled = true,
	maxAge = 300,
	sMaxAge = 600,
}: CacheControlOptions = {}): RequestHandler {
	return (_: Request, res: Response, next: NextFunction) => {
		// NOTE(joel): We allow the user to disable caching all together.
		if (!enabled) {
			res.set('Cache-Control', `no-cache, no-store, must-revalidate`);
			return next();
		}

		// NOTE(joel): Disable caching in development
		if (process.env.NODE_ENV !== 'production') {
			res.set(
				'Cache-Control',
				`private, no-cache, no-store, max-age=0, must-revalidate`,
			);
			return next();
		}

		res.set(
			'Cache-Control',
			`public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate`,
		);
		return next();
	};
}
