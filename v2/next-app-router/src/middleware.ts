import { NextResponse } from 'next/server';
import { withCsrf } from '@/lib/csrf-middleware';
import { withLocale } from '@/lib/locale/middleware';
import type { ChainableMiddleware, MiddlewareFactory } from '@/types';

////////////////////////////////////////////////////////////////////////////////

export default chainMiddleware([withCsrf, withLocale]);

////////////////////////////////////////////////////////////////////////////////

/**
 * Helper to compose multiple MiddlewareFactory instances together.
 */
function chainMiddleware(
	fns: MiddlewareFactory[] = [],
	idx = 0,
): ChainableMiddleware {
	const current = fns[idx];
	if (current) {
		const next = chainMiddleware(fns, idx + 1);
		return current(next);
	}

	return async request => NextResponse.next({ request });
}

////////////////////////////////////////////////////////////////////////////////

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - metadata files (`ls -pA public | sed -e 's/^/\//'` from the root of
		 *                   this repository + 'sitemap.xml|robots.txt')
		 */
		'/((?!api|_next/static|_next/image|android-chrome-192x192.png|android-chrome-512x512.png|apple-touch-icon.png|favicon-16x16.png|favicon-32x32.png|favicon.ico|logo.svg|site.webmanifest|sitemap.xml|robots.txt).*)',
	],
};
