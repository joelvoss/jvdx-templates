import DE from './de.json';
import EN from './en.json';

export const languages = {
	de: { locale: 'de', dict: DE },
	en: { locale: 'en', dict: EN },
};

export const locales = Object.keys(languages);
export const defaultLocale = locales[0];
