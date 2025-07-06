import DE from './de.json';
import EN from './en.json';

////////////////////////////////////////////////////////////////////////////////

type Locale = keyof typeof languages;
type Dict = (typeof languages)[keyof typeof languages]['dict'];

////////////////////////////////////////////////////////////////////////////////

export const languages = {
	de: { locale: 'de', dict: DE },
	en: { locale: 'en', dict: EN },
};

export const locales = Object.keys(languages);
export const defaultLocale = locales[0];

export const dictionary = Object.values(languages).reduce(
	(acc, lng) => {
		acc[lng.locale] = lng.dict;
		return acc;
	},
	{} as Record<Locale, Dict>,
);
