import {
	type NextFetchEvent,
	type NextRequest,
	NextResponse,
} from 'next/server';
import type { ChainableMiddleware } from '@/types';

////////////////////////////////////////////////////////////////////////////////

const csrfSafeMethods = ['get', 'head', 'options'];
const csrfSafeFetches = ['same-origin', 'none'];
const errMsg = 'CSRF check failed';

////////////////////////////////////////////////////////////////////////////////

/**
 * Since 2023, major browsers offer a new protection from CSRF: the
 * `Sec-Fetch-Site` header. withCsrf is a middleware that checks this header
 * and the Origin header to ensure that requests are coming from the same
 * origin as the server.
 */
export function withCsrf(next: ChainableMiddleware): ChainableMiddleware {
	return async (request: NextRequest, event: NextFetchEvent) => {
		const method = request.method.toLowerCase();
		if (csrfSafeMethods.includes(method)) return next(request, event);

		const secFetchSite = request.headers.get('Sec-Fetch-Site') || '';
		if (csrfSafeFetches.includes(secFetchSite)) return next(request, event);

		// NOTE(joel): If the Sec-Fetch-Site header is missing, fall back to
		// validating the Origin header. This ensures that requests without
		// Sec-Fetch-Site are only allowed if the Origin matches the Host header.
		try {
			if (secFetchSite === '') {
				const origin = request.headers.get('Origin') || '';
				if (origin === '') {
					throw new Error(errMsg);
				}

				const parsed = new URL(origin);
				if (parsed.host !== request.headers.get('host')) {
					throw new Error(errMsg);
				}
			} else {
				throw new Error(errMsg);
			}
		} catch (err) {
			return NextResponse.json(
				{ success: false, message: err.message },
				{ status: 403 },
			);
		}

		return next(request, event);
	};
}
