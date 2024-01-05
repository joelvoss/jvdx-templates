import { NextResponse } from 'next/server';
import {
	CSRF_BODY_NAME,
	CSRF_COOKIE_NAME,
	CSRF_HEADER_TOKEN,
	CSRF_HEADER_VERIFIED,
	CSRF_SECRET,
} from '@/constants';

import type { NextRequest } from 'next/server';
type CSRF = { token: string; verified: '0' | '1' };

////////////////////////////////////////////////////////////////////////////////

/**
 * Handle the CSRF token for a request and re-generate one if necessary.
 */
export async function handleRequestCsrf(
	request: NextRequest,
	response: NextResponse,
) {
	const contentType = request.headers.get('content-type');
	const cookieCsrf = request.cookies.get(CSRF_COOKIE_NAME)?.value;
	const headerCsrf = request.headers.get(CSRF_HEADER_TOKEN);
	let bodyCsrf = '';

	// NOTE(joel): If the request is a multipart form data request, we try to
	// extract the CSRF token from the request body to verify it against the
	// token in the cookie.
	if (contentType?.startsWith('multipart/form-data')) {
		let rawBodyText = await new Response(request.body).text();
		const boundary =
			'--' + contentType.split(';')[1].replace('boundary=', '').trim();
		rawBodyText.split(boundary).forEach(part => {
			if (part.trim() === '' || part.trim() === '--') return;
			const [headers, body] = part.split('\r\n\r\n');
			const contentDisposition = headers.match(
				/Content-Disposition:.*name="(.+)"(?:;|$)/i,
			);
			if (contentDisposition && contentDisposition[1]) {
				const fieldName = contentDisposition[1].trim();
				if (fieldName.includes(CSRF_BODY_NAME)) bodyCsrf = body.trim();
			}
		});
	}

	const secret = await createHash(CSRF_SECRET);

	const csrf: CSRF = { token: '', verified: '0' };

	if (cookieCsrf) {
		const [tokenValue, tokenHash] = cookieCsrf.split('|');
		const reference = await createHash(tokenValue + secret);
		// NOTE(joel): If the hash of the cookie matches our reference hash, we
		// know the cookie was set by us.
		if (tokenHash === reference) {
			csrf.token = tokenValue;
			// NOTE(joel): If the token in the request header matches the token of
			// the cookie then we know the request is from the same origin, or
			// "verified".
			// TODO(joel): Maybe do this as a function in server actions?
			if (tokenValue === headerCsrf || tokenValue === bodyCsrf) {
				csrf.verified = '1';
			}
		}
	}

	// NOTE(joel): Create a new CSRF token if there is none because it's not been
	// set yet, or because the hash doesn't match (e.g. because it's been
	// modifed or because the secret has changed).
	if (csrf.token === '') {
		csrf.token = toHex(crypto.getRandomValues(new Uint8Array(32)));
		const sig = await createHash(csrf.token + secret);
		return next(request, response, {
			cookieValue: `${csrf.token}|${sig}`,
			csrf,
		});
	}

	return next(request, response, { csrf });
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Create a hash from a string input.
 */
async function createHash(input: string) {
	const bufferSource = new TextEncoder().encode(input);
	const secretBuffer = await crypto.subtle.digest('SHA-256', bufferSource);
	return toHex(new Uint8Array(secretBuffer));
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Convert a Uint8Array to a hex string.
 */
function toHex(input: Uint8Array) {
	return Array.from(input)
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
}

////////////////////////////////////////////////////////////////////////////////

type NextPayload = {
	cookieValue?: string;
	csrf: CSRF;
};

/**
 * Helper function to return a NextResponse with the CSRF token and cookie set.
 */
function next(
	request: NextRequest,
	response: NextResponse,
	payload: NextPayload,
) {
	const { cookieValue, csrf } = payload;

	// NOTE(joel): Modify the request headers without cloning the request
	// object so that the CSRF token is included in the request for the following
	// middleware handler.
	request.headers.set(CSRF_HEADER_TOKEN, csrf.token);
	request.headers.set(CSRF_HEADER_VERIFIED, csrf.verified);

	const r = NextResponse.next({
		...response,
		// NOTE(joel): We have to set our modified request headers here so they
		// are available in React Server Components / Root-Layout.
		request: { headers: request.headers },
	});

	if (cookieValue) {
		r.cookies.set(CSRF_COOKIE_NAME, cookieValue, {
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
			secure: request.nextUrl.protocol.startsWith('https'),
		});
	}

	return r;
}
