import create from 'zustand';
import { rosetta } from '@/lib/rosetta';
import { immer } from '@/lib/zustand-immer';
import { languages, defaultLocale } from '@/locales/index';
import { isNonNull } from '@/lib/assertions';

////////////////////////////////////////////////////////////////////////////////

import type { GetState } from 'zustand';
import type { ImmerSet } from '@/lib/zustand-immer';

type I18nState = {
	locale: string;
	defaultLocale: string;
	translate: (...payload: TranslatePayload) => string;
	changeLocale: (payload: ChangeLocalePayload) => void;
	isDefaultLocale: () => boolean;
};

type I18nGet = GetState<I18nState>;
type I18nSet = ImmerSet<I18nState>;

type TranslatePayload = [
	key: string | (string | number)[],
	params?: any,
	lang?: string | undefined,
];

type ChangeLocalePayload = {
	locale: string;
	defaultLocale?: string;
};

////////////////////////////////////////////////////////////////////////////////

let dictionary: { [key: string]: any } = {};
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

export const useI18n = create<I18nState>(
	immer((set, get) => ({
		...initialState,
		translate: (...payload) => translate(payload, get),
		changeLocale: payload => changeLocale(payload, set, get),
		isDefaultLocale: () => isDefaultLocale(get),
	})),
);

////////////////////////////////////////////////////////////////////////////////

/**
 * translate queries the dictionary for the requested translation by key.
 */
function translate(payload: TranslatePayload, get: I18nGet) {
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
 * changeLocale sets new `locale` and `defaultLocale` values.
 */
function changeLocale(
	payload: ChangeLocalePayload,
	set: I18nSet,
	get: I18nGet,
) {
	const { locale, defaultLocale } = payload;

	const { locale: currentLocale } = get();
	if (locale === currentLocale) return;

	i18n.locale(locale);

	set(s => {
		if (isNonNull(locale)) {
			s.locale = locale;
		}
		if (isNonNull(defaultLocale)) {
			s.defaultLocale = defaultLocale;
		}
	});
}

////////////////////////////////////////////////////////////////////////////////

/**
 * isDefaultLocale checks if the current locale is the default locale.
 */
function isDefaultLocale(get: I18nGet) {
	const { locale, defaultLocale } = get();
	return locale === defaultLocale;
}
