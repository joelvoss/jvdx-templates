import { getLocale } from '@/lib/locale/server';
import { rosetta } from '@/lib/rosetta';
import { dictionary } from '@/locales';

/**
 * Custom hook to get the i18n instance based on the provided language.
 * If no language is provided, it defaults to the application's default locale.
 */
export async function useI18n(lang?: string | null) {
	const locale = await getLocale();
	const resolvedLang = lang ?? locale;
	return rosetta(dictionary, resolvedLang);
}
