import 'server-only';

import { headers } from 'next/headers';
import { CSRF_HEADER_TOKEN, CSRF_HEADER_VERIFIED } from '@/constants';

////////////////////////////////////////////////////////////////////////////////

/**
 * Get the CSRF token from request headers on the server.
 */
export async function getCsrfToken() {
	const headersList = await headers();
	return headersList.get(CSRF_HEADER_TOKEN) || '';
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Test the "CSRF-Verified"-header to see if the CSRF token was verified.
 */
export async function verifyCsrf() {
	const headersList = await headers();
	const verifiedHeader = headersList.get(CSRF_HEADER_VERIFIED);
	return verifiedHeader === '1';
}
