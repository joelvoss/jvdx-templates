import 'server-only';

import { headers } from 'next/headers';
import { CSRF_HEADER_TOKEN, CSRF_HEADER_VERIFIED } from '@/constants';

////////////////////////////////////////////////////////////////////////////////

/**
 * Get the CSRF token from request headers on the server.
 */
export function getCsrfToken() {
	const headersList = headers();
	return headersList.get(CSRF_HEADER_TOKEN) || '';
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Test the "CSRF-Verified"-header to see if the CSRF token was verified.
 */
export function verifyCsrf() {
	const verifiedHeader = headers().get(CSRF_HEADER_VERIFIED);
	return verifiedHeader === '1';
}
