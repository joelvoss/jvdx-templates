import { useMemo } from 'react';
import { useLocale } from '@/lib/locale/client';
import { rosetta } from '@/lib/rosetta';
import { dictionary } from '@/locales';

/**
 * Custom hook to get the i18n instance based on the provided language.
 * If no language is provided, it defaults to the application's default locale.
 */
export function useI18n(lang?: string | null) {
	const locale = useLocale();
	const resolvedLang = lang ?? locale;
	return useMemo(() => rosetta(dictionary, resolvedLang), [resolvedLang]);
}
