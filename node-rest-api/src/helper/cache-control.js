/**
 * cacheControl is an Express middleware to simplify setting `Cache-Control`
 * headers.
 * @param {{ maxAge?: number, sMaxAge?: number} | boolean } opts
 */
export function cacheControl(opts = {}) {
	return (_, res, done) => {
		// NOTE(joel): We allow the user to disable caching all together.
		if (opts === false) {
			res.set('Cache-Control', `no-cache, no-store, must-revalidate`);
			return done();
		}

		const maxAge = opts.maxAge || 300; // 5 minutes
		const sMaxAge = opts.sMaxAge || 600; // 10 minutes

		// NOTE(joel): Disable caching in development
		if (process.env.NODE_ENV !== 'production') {
			res.set(
				'Cache-Control',
				`private, no-cache, no-store, max-age=0, must-revalidate`,
			);
			return done();
		}

		res.set(
			'Cache-Control',
			`public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate`,
		);
		done();
	};
}
