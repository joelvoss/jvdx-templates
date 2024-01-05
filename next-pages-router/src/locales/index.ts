import DE from './de.json';

export const languages = {
	de: { locale: 'de', dict: DE },
};

export const locales = Object.keys(languages);
export const defaultLocale = locales[0];
