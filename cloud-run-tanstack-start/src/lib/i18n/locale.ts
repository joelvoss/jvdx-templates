import { readCookie } from "~/lib/cookies";
import {
	defaultLocale,
	I18N_COOKIE_NAME,
	type Locale,
	supportedLocales,
} from "~/lib/i18n/config";

////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if the given locale string is a valid supported locale. It verifies
 * that the locale is included in the `supportedLocales` array defined in the
 * configuration.
 */
export function isValidLocale(locale: string | undefined): locale is Locale {
	return supportedLocales.includes(locale as Locale);
}

////////////////////////////////////////////////////////////////////////////////

const ignoredPathsRegex = /^\/(?:api)(?:\/|$)/;

/**
 * Determines whether the given pathname should be ignored for locale
 * extraction. It checks if the pathname starts with "/api" or any other paths
 * that should be excluded from locale processing. This is useful to prevent
 * interference with API routes or other non-localized paths.
 */
export function shouldIgnorePath(pathname: string): boolean {
	return ignoredPathsRegex.test(pathname);
}

////////////////////////////////////////////////////////////////////////////////

const extractRegExp = /^\/([a-z]{2})(?:\/|$)/;

/**
 * Extracts the locale from the given pathname. It looks for a two-letter
 * language code at the beginning of the path (e.g., "/en/", "/de/"). If a
 * valid locale is found and it is not the default locale, it returns the
 * locale. Otherwise, it returns `null`.
 */
export function extractLocaleFromPath(pathname: string): Locale | null {
	const match = extractRegExp.exec(pathname);
	const locale = match?.[1];

	if (!locale) return null;
	if (!isValidLocale(locale)) return null;
	if (locale === defaultLocale) return null;

	return locale;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Parses the locale from the given cookie string. It looks for a cookie with
 * the name defined in `I18N_COOKIE_NAME` and returns its value if found. If
 * the cookie is not present or does not contain a valid locale, it returns
 * `null`.
 */
export function parseLocaleCookie(cookieString: string | null) {
	return readCookie(cookieString, I18N_COOKIE_NAME);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * List of BIDI (bidirectional) languages that are written right-to-left (RTL).
 * Source: https://en.wikipedia.org/wiki/List_of_bidi_languages
 */
const BIDI_RTL_LANGS = new Set<string>([
	"ae",
	"ar",
	"arc",
	"bcc",
	"bqi",
	"ckb",
	"dv",
	"fa",
	"glk",
	"he",
	"ku",
	"mzn",
	"nqo",
	"pnb",
	"prs",
	"ps",
	"sd",
	"ug",
	"ur",
	"yi",
]);

const DIR_STRINGS = { ltr: "ltr", rtl: "rtl" } as const;
type Dir = (typeof DIR_STRINGS)[keyof typeof DIR_STRINGS];

/**
 * Determines the text direction (LTR or RTL) based on the given locale.
 * It checks the primary language subtag against a predefined list of RTL
 * languages.
 */
export function getDirFromLocale(locale: string) {
	let dir: Dir = DIR_STRINGS.ltr;

	if (!locale) return dir;

	const normalized = String(locale).trim();
	if (!normalized) return dir;

	const [langRaw] = normalized.split(/[-_]/);
	const lang = (langRaw || "").toLowerCase();
	if (!lang) return dir;

	if (BIDI_RTL_LANGS.has(lang)) {
		dir = DIR_STRINGS.rtl;
	}

	return dir;
}
