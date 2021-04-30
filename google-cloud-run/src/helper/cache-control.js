/**
 * @typedef {Object} CacheControlOptions
 * @prop {boolean} [enabled=true]
 * @prop {number} [maxAge=300]
 * @prop {number} [sMaxAge=600]
 */

/**
 * cacheControl is an Express middleware to simplify setting `Cache-Control`
 * headers.
 * @param {CacheControlOptions} opts
 * @returns {express.RequestHandler}
 */
export function cacheControl(opts = {}) {
	const options = {
		enabled: typeof opts === 'boolean' ? opts : true,
		maxAge: 300, // 5 minutes
		sMaxAge: 600, // 10 minutes
		...opts,
	};

	return (_, res, next) => {
		// NOTE(joel): We allow the user to disable caching all together.
		if (!options.enabled) {
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
			`public, max-age=${options.maxAge}, s-maxage=${options.sMaxAge}, stale-while-revalidate`,
		);
		next();
	};
}
