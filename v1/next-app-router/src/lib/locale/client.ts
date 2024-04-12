import 'client-only';

import { useSearchParams } from 'next/navigation';
import { LOCALE_SEARCHPARAM_NAME } from '@/constants';
import { defaultLocale } from '@/locales';

////////////////////////////////////////////////////////////////////////////////

/**
 * Get the locale from the URL search params.
 * Falls back to the default locale of none was found in the URL.
 */
export function useLocale() {
	const searchParams = useSearchParams();
	return searchParams.get(LOCALE_SEARCHPARAM_NAME) || defaultLocale;
}
