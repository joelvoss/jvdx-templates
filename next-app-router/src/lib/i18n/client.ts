import { useMemo } from 'react';
import { rosetta } from '@/lib/rosetta';
import { defaultLocale, dictionary } from '@/locales';

/**
 * Custom hook to get the i18n instance based on the provided language.
 * If no language is provided, it defaults to the application's default locale.
 */
export function useI18n(lang?: string | null) {
	const resolvedLang = lang ?? defaultLocale;
	return useMemo(() => rosetta(dictionary, resolvedLang), [resolvedLang]);
}
