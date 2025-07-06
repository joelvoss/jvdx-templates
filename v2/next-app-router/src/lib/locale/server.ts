import 'server-only';

import { headers } from 'next/headers';
import { LOCALE_HEADER_NAME } from '@/constants';
import { defaultLocale } from '@/locales';

////////////////////////////////////////////////////////////////////////////////

/**
 * Get the locale from the request headers on the server.
 * Falls back to the default locale of none was found in the headers.
 */
export async function getLocale() {
	const headerList = await headers();
	return headerList.get(LOCALE_HEADER_NAME) || defaultLocale;
}
