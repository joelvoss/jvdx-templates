import create from 'zustand';
import { rosetta } from '@/lib/rosetta';
import { immer } from '@/lib/zustand-immer';
import { languages, defaultLocale } from '@/locales/index';

////////////////////////////////////////////////////////////////////////////////

let dictionary = {};
for (let lng of Object.values(languages)) {
	dictionary[lng.locale] = lng.dict;
}
const i18n = rosetta(dictionary, defaultLocale);

////////////////////////////////////////////////////////////////////////////////

const initialState = {
	locale: defaultLocale,
	defaultLocale,
};

////////////////////////////////////////////////////////////////////////////////

export const useI18n = create(
	immer((set, get) => ({
		...initialState,
		translate: (...payload) => translate(payload, get),
		changeLocale: payload => changeLocale(payload, set, get),
		isDefaultLocale: () => isDefaultLocale(get),
	})),
);

////////////////////////////////////////////////////////////////////////////////

/**
 * translate
 * @param {[string, any]} payload
 * @param {import('zustand').GetState} get
 */
function translate(payload, get) {
	const { defaultLocale } = get();

	let translation = i18n.t(...payload);
	// NOTE(joel): If a single translation is missing, try getting a
	//             translation for the default locale instead.
	if (!translation || translation.length === 0) {
		// NOTE(joel): translate(<key>, <params?>, <locale?>
		translation = i18n.t(payload[0], payload[1], defaultLocale);
	}

	return translation;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * changeLocale
 * @param {{ locale: string, defaultLocale: string }} payload
 * @param {import('zustand').SetState} set
 * @param {import('zustand').GetState} get
 */
function changeLocale(payload, set, get) {
	const { locale, defaultLocale } = payload;

	const { locale: currentLocale } = get();
	if (locale === currentLocale) return;

	i18n.locale(locale);

	set(s => {
		s.locale = locale;
		s.defaultLocale = defaultLocale;
	});
}

////////////////////////////////////////////////////////////////////////////////

/**
 * isDefaultLocale
 * @param {import('zustand').GetState} get
 * @returns {boolean}
 */
function isDefaultLocale(get) {
	const { locale, defaultLocale } = get();
	return locale === defaultLocale;
}
