import { useCallback, useMemo } from 'react';
import { proxy, useSnapshot } from 'valtio';
import { rosetta } from '@/lib/rosetta';
import { languages, defaultLocale } from '@/locales/index';
import { isNonNull } from '@/lib/assertions';

////////////////////////////////////////////////////////////////////////////////

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

// NOTE(joel): Setup rosetta.
let dictionary: { [key: string]: any } = {};
for (let lng of Object.values(languages)) {
	dictionary[lng.locale] = lng.dict;
}
const i18n = rosetta(dictionary, defaultLocale);

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): Setup proxy state.
export const state = proxy({
	locale: defaultLocale,
	defaultLocale,
});

////////////////////////////////////////////////////////////////////////////////

/**
 * Helper function to reset state (used in tests)
 */
export function resetState() {
	state.locale = defaultLocale;
	state.defaultLocale = defaultLocale;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * useI18n listens for changes of our proxy state and returns methods to
 * help us translate strings.
 */
export function useI18n() {
	const snap = useSnapshot(state);

	/**
	 * translate queries the dictionary for the requested translation by key.
	 */
	const translate = useCallback(
		(...payload: TranslatePayload) => {
			let translation = i18n.t(...payload);
			// NOTE(joel): If a single translation is missing, try getting a
			//             translation for the default locale instead.
			if (!translation || translation.length === 0) {
				// NOTE(joel): translate(<key>, <params?>, <locale?>
				translation = i18n.t(payload[0], payload[1], snap.defaultLocale);
			}

			return translation;
		},
		[snap.defaultLocale],
	);

	/**
	 * changeLocale sets new `locale` and `defaultLocale` values.
	 */
	const changeLocale = useCallback(
		(payload: ChangeLocalePayload) => {
			const { locale, defaultLocale } = payload;
			if (locale === snap.locale) return;

			i18n.locale(locale);

			if (isNonNull(locale)) {
				state.locale = locale;
			}
			if (isNonNull(defaultLocale)) {
				state.defaultLocale = defaultLocale;
			}
		},
		[snap.locale],
	);

	/**
	 * isDefaultLocale returns true if the current locale is the default locale.
	 */
	const isDefaultLocale = useMemo(
		() => snap.locale === snap.defaultLocale,
		[snap.defaultLocale, snap.locale],
	);

	return {
		t: translate,
		changeLocale,
		isDefaultLocale,
	};
}
