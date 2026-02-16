import {
	createIsomorphicFn,
	createServerFn,
	createServerOnlyFn,
} from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { cloneElement, isValidElement, type ReactNode } from "react";
import * as v from "valibot";

import { defaultLocale, messages, supportedLocales } from "~/translations";

////////////////////////////////////////////////////////////////////////////////

export type Locale = (typeof supportedLocales)[number];
export type AbstractIntlMessages = {
	[key: string]: string | AbstractIntlMessages;
};

////////////////////////////////////////////////////////////////////////////////

export const windowKey = `$__i18n`;

////////////////////////////////////////////////////////////////////////////////

/**
 * Gets the current locale based on cookies or URL path.
 * We use the createIsomorphicFn utility to create a function that works
 * both on the server and client sides with different implementations.
 */
export const getCurrentLocale = createIsomorphicFn()
	.server(() => {
		const request = getRequest();
		const url = new URL(request.url);

		let locale: string;
		if (shouldIgnorePath(url.pathname)) {
			locale =
				parseLocaleCookie(request.headers.get("cookie")) ?? defaultLocale;
		} else {
			locale = extractLocaleFromPath(url.pathname) ?? defaultLocale;
		}
		return { locale, isDefault: locale === defaultLocale };
	})
	.client(() => {
		let locale: string;
		if (shouldIgnorePath(window.location.pathname)) {
			locale = parseLocaleCookie(document.cookie) ?? defaultLocale;
		} else {
			locale = extractLocaleFromPath(window.location.pathname) ?? defaultLocale;
		}
		return { locale, isDefault: locale === defaultLocale };
	});

////////////////////////////////////////////////////////////////////////////////

const GetMessagesSchema = v.object({
	locale: v.pipe(
		v.string(),
		v.check((locale: string) => isValidLocale(locale), "Invalid locale"),
	),
});

/**
 * Server function to fetch i18n messages for a locale.
 */
export const getMessagesFn = createServerFn({ method: "GET" })
	.inputValidator(GetMessagesSchema)
	.handler(async ({ data }) => {
		return messages[data.locale] || {};
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Isomorphic function to get messages for the current locale, using
 * sessionStorage on the client for caching.
 */
export const getCurrentMessages = createIsomorphicFn()
	.server(async (locale) => {
		const messages = await getMessagesFn({ data: { locale } });
		return messages;
	})
	.client(async (locale) => {
		let messages: Record<string, AbstractIntlMessages> = {};
		if (windowKey in window && window[windowKey]) {
			messages = window[windowKey] as Record<string, AbstractIntlMessages>;
		} else {
			messages = await getMessagesFn({ data: { locale } });
		}
		return messages;
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Removes locale from the URL path.
 * Example: /en/about -> /about
 */
export function deLocalizeUrl(url: URL): URL {
	if (shouldIgnorePath(url.pathname)) return url;

	const locale = extractLocaleFromPath(url.pathname);
	if (locale) {
		const newUrl = new URL(url);
		newUrl.pathname = url.pathname.replace(`/${locale}`, "") || "/";
		return newUrl;
	}
	return url;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Adds locale to the URL path.
 * Example: /about -> /en/about
 */
export function localizeUrl(url: URL): URL {
	if (shouldIgnorePath(url.pathname)) return url;

	const { locale, isDefault } = getCurrentLocale();
	if (isDefault) return url;

	const newUrl = new URL(url);
	newUrl.pathname = `/${locale}${url.pathname === "/" ? "" : url.pathname}`;
	return newUrl;
}

////////////////////////////////////////////////////////////////////////////////

export const i18nCookieName = "__i18n_locale";

/**
 * Parses the locale from the cookie string.
 */
export const i18nMiddleware = createServerOnlyFn((request: Request) => {
	const url = new URL(request.url);
	const pathname = url.pathname;

	// NOTE(joel): Skip ignored paths.
	if (shouldIgnorePath(pathname)) {
		return {};
	}

	// NOTE(joel): Redirect default locale URLs to non-locale URLs.
	// Cookies are ignored here since the URL has precedence.
	if (
		pathname.startsWith(`/${defaultLocale}/`) ||
		pathname === `/${defaultLocale}`
	) {
		url.pathname = pathname.replace(`/${defaultLocale}`, "") || "/";
		return { redirect: Response.redirect(url.toString(), 301) };
	}

	const urlLocale = extractLocaleFromPath(pathname);
	if (urlLocale) {
		// NOTE(joel): Strip locale from ignored paths.
		const strippedPath = pathname.replace(`/${urlLocale}`, "") || "/";
		if (shouldIgnorePath(strippedPath)) {
			url.pathname = strippedPath;
			return { redirect: Response.redirect(url.toString(), 301) };
		}

		// NOTE(joel): Sync cookie when URL has explicit locale.
		const cookieLocale = parseLocaleCookie(request.headers.get("cookie"));
		if (urlLocale !== cookieLocale) {
			return {
				setCookie: `${i18nCookieName}=${encodeURIComponent(urlLocale)}; Path=/; HttpOnly; SameSite=Lax`,
			};
		}
	}

	return {};
});

////////////////////////////////////////////////////////////////////////////////

/**
 * Type guard to check if a given locale is valid.
 */
export function isValidLocale(locale: string | undefined): locale is Locale {
	return supportedLocales.includes(locale as Locale);
}

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): Paths that bypass locale handling entirely.
const ignoredPathsRegex = /^\/(?:api)(?:\/|$)/;

/**
 * Checks if the given pathname should bypass locale handling.
 */
export function shouldIgnorePath(pathname: string): boolean {
	return ignoredPathsRegex.test(pathname);
}

////////////////////////////////////////////////////////////////////////////////

const extractRegExp = /^\/([a-z]{2})(?:\/|$)/;

/**
 * Extracts the locale from the given pathname.
 * Returns null if no valid locale is found or if it matches the default locale.
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
 * Parses the locale from a cookie string.
 */
export function parseLocaleCookie(cookieString: string | null) {
	if (!cookieString) return null;

	const cookies = cookieString.split(";").map((cookie) => cookie.trim());
	for (const cookie of cookies) {
		const [name, value] = cookie.split("=");
		if (name === "locale") {
			return decodeURIComponent(value);
		}
	}

	return null;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Helper to get nested message by path.
 * E.g., path "nav.books" on messages { nav: { books: "Books" } } returns
 * "Books".
 */
export function getNestedMessage(messages: AbstractIntlMessages, path: string) {
	if (!messages || !path) return undefined;
	return path.split(".").reduce((acc: any, part) => acc && acc[part], messages);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Helper to find the matching closing brace.
 */
function findClosingBrace(text: string, startIndex: number): number {
	let balance = 1;
	for (let i = startIndex; i < text.length; i++) {
		const code = text.charCodeAt(i);
		if (code === 123 /* { */) balance++;
		else if (code === 125 /* } */) balance--;

		if (balance === 0) return i;
	}
	return -1;
}

////////////////////////////////////////////////////////////////////////////////

const numberFormatCache = new Map<string, Intl.NumberFormat>();

/**
 * Gets a cached Intl.NumberFormat instance.
 */
function getNumberFormatter(locale: string) {
	if (!numberFormatCache.has(locale)) {
		numberFormatCache.set(locale, new Intl.NumberFormat(locale));
	}
	return numberFormatCache.get(locale)!;
}

////////////////////////////////////////////////////////////////////////////////

const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Gets a cached Intl.DateTimeFormat instance.
 */
function getDateTimeFormatter(
	locale: string,
	options?: Intl.DateTimeFormatOptions,
) {
	const key = `${locale}-${JSON.stringify(options)}`;
	if (!dateTimeFormatCache.has(key)) {
		dateTimeFormatCache.set(key, new Intl.DateTimeFormat(locale, options));
	}
	return dateTimeFormatCache.get(key)!;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Parses options from a plural/select ICU message segment.
 */
function parseOptions(text: string): Record<string, string> {
	const options: Record<string, string> = {};

	let i = 0;
	// 32=Space, 9=Tab, 10=LF, 13=CR, 160=NBSP
	const isWhitespace = (code: number) =>
		code === 32 || code === 9 || code === 10 || code === 13 || code === 160;

	while (i < text.length) {
		let code = text.charCodeAt(i);
		while (isWhitespace(code)) {
			i++;
			if (i >= text.length) break;
			code = text.charCodeAt(i);
		}
		if (i >= text.length) break;

		let start = i;
		while (
			i < text.length &&
			code !== 123 /* { */ &&
			code !== 125 /* } */ &&
			!isWhitespace(code)
		) {
			i++;
			if (i >= text.length) break;
			code = text.charCodeAt(i);
		}

		const key = text.slice(start, i);

		while (isWhitespace(code)) {
			i++;
			if (i >= text.length) break;
			code = text.charCodeAt(i);
		}

		if (code === 123 /* { */) {
			const closeIndex = findClosingBrace(text, i + 1);
			if (closeIndex !== -1) {
				options[key] = text.slice(i + 1, closeIndex);
				i = closeIndex + 1;
			} else {
				break;
			}
		} else {
			i++;
		}
	}
	return options;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Formats a message string with the given values.
 */
export function formatMessage(
	message: string,
	values: Record<string, unknown> | undefined,
	locale: string,
	isRich: boolean = false,
) {
	if (!message) return "";

	let result: (string | ReactNode)[] = [];
	let textBuffer = "";

	// NOTE(joel): Flushes the text buffer to the result array.
	const flushBuffer = () => {
		if (!textBuffer) return;
		result.push(textBuffer);
		textBuffer = "";
	};

	let i = 0;
	while (i < message.length) {
		const code = message.charCodeAt(i);

		// NOTE(joel): Variable / ICU Syntax.
		if (code === 123 /* { */) {
			flushBuffer();
			const closeIndex = findClosingBrace(message, i + 1);
			if (closeIndex === -1) {
				textBuffer += "{";
				i++;
				continue;
			}

			// NOTE(joel): Slice content inside {} to parse.
			const content = message.slice(i + 1, closeIndex);
			const firstComma = content.indexOf(",");
			let key = content;
			let type = "";
			let rest = "";

			// NOTE(joel): Parse {key, type, format}.
			if (firstComma !== -1) {
				key = content.slice(0, firstComma).trim();
				const restContent = content.slice(firstComma + 1).trim();

				const secondComma = restContent.indexOf(",");
				if (secondComma !== -1) {
					type = restContent.slice(0, secondComma).trim();
					rest = restContent.slice(secondComma + 1).trim();
				} else {
					type = restContent;
				}
			}

			const value = values?.[key];

			// NOTE(joel): Handle Plurals & SelectOrdinal.
			if (type === "plural" || type === "selectordinal") {
				const offsetMatch = rest.match(/offset:\s*(\d+)/);
				const offset = offsetMatch ? parseInt(offsetMatch[1], 10) : 0;
				let numValue = (typeof value === "number" ? value : 0) - offset;
				const cleanRest = rest.replace(/offset:\s*\d+/, "");
				const options = parseOptions(cleanRest);

				const pluralType = type === "selectordinal" ? "ordinal" : "cardinal";
				let rule = "other";
				try {
					rule = new Intl.PluralRules(locale, { type: pluralType }).select(
						numValue,
					);
				} catch {
					/* fallback */
				}

				let selectedRaw =
					options[`=${numValue}`] ?? options[rule] ?? options["other"] ?? "";

				const formattedNum = getNumberFormatter(locale).format(numValue);
				// NOTE(joel): Replace # with formatted number.
				selectedRaw = selectedRaw.replace(
					/(^|[^{])#(?=([^{]|$))/g,
					`$1${formattedNum}`,
				);

				const selectedProcessed = formatMessage(
					selectedRaw,
					values,
					locale,
					isRich,
				);

				if (Array.isArray(selectedProcessed)) {
					result.push(...selectedProcessed);
				} else {
					result.push(selectedProcessed);
				}
			} else if (type === "select") {
				// NOTE(joel): Handle Select.
				const options = parseOptions(rest);
				const selectedRaw = options[String(value)] ?? options["other"] ?? "";
				const selectedProcessed = formatMessage(
					selectedRaw,
					values,
					locale,
					isRich,
				);

				if (Array.isArray(selectedProcessed)) {
					result.push(...selectedProcessed);
				} else {
					result.push(selectedProcessed);
				}
			} else if (type === "number") {
				// NOTE(joel): Handle Number.
				result.push(getNumberFormatter(locale).format(Number(value || 0)));
			} else if (type === "date" || type === "time") {
				// NOTE(joel): Handle Date/Time.
				const formatter = getDateTimeFormatter(locale, {
					dateStyle: type === "date" ? "medium" : undefined,
					timeStyle: type === "time" ? "medium" : undefined,
				});
				result.push(
					formatter.format(new Date((value as string | number | Date) || 0)),
				);
			} else {
				// NOTE(joel): Handle simple value.
				if (isRich && (isValidElement(value) || Array.isArray(value))) {
					if (isValidElement(value)) {
						result.push(cloneElement(value, { key: i }));
					} else if (Array.isArray(value)) {
						result.push(
							...value.map((item, idx) =>
								isValidElement(item)
									? cloneElement(item, { key: `${i}-${idx}` })
									: item,
							),
						);
					}
				} else {
					// oxlint-disable typescript/no-base-to-string
					result.push(String(value !== undefined ? value : ""));
				}
			}

			i = closeIndex + 1;
			continue;
		}

		// NOTE(joel): Rich Text.
		if (isRich && code === 60 /* < */) {
			const endTagStart = message.indexOf(">", i);
			if (endTagStart !== -1) {
				const fullTag = message.slice(i + 1, endTagStart);

				if (
					!fullTag.startsWith(" ") &&
					/^[a-zA-Z0-9_-]+(\/)?$/.test(fullTag.split(" ")[0])
				) {
					flushBuffer();

					const isSelfClosing = fullTag.endsWith("/");
					const tagName = fullTag.replace("/", "").trim();

					if (isSelfClosing) {
						const renderFn = values?.[tagName];
						try {
							if (typeof renderFn === "function") {
								const node = renderFn(undefined);
								if (isValidElement(node)) {
									result.push(cloneElement(node, { key: i }));
								} else {
									result.push(node);
								}
							} else if (isValidElement(renderFn)) {
								result.push(cloneElement(renderFn, { key: i }));
							} else {
								if (!renderFn) {
									result.push(`<${fullTag}>`);
								}
							}
						} catch (error) {
							console.error(`Error rendering tag <${tagName}/>:`, error);
							result.push(`<${fullTag}>`);
						}
						i = endTagStart + 1;
						continue;
					} else {
						const closingTag = `</${tagName}>`;
						const closingIndex = message.indexOf(closingTag, endTagStart);

						if (closingIndex !== -1) {
							const innerContent = message.slice(endTagStart + 1, closingIndex);
							const children = formatMessage(
								innerContent,
								values,
								locale,
								isRich,
							);

							const renderFn = values?.[tagName];
							try {
								if (typeof renderFn === "function") {
									const node = renderFn(children);
									if (isValidElement(node)) {
										result.push(cloneElement(node, { key: i }));
									} else {
										result.push(node);
									}
								} else {
									if (Array.isArray(children)) {
										result.push(
											...children.map((child, idx) =>
												isValidElement(child)
													? cloneElement(child, {
															key: `${i}-${idx}`,
														})
													: child,
											),
										);
									} else if (isValidElement(children)) {
										result.push(cloneElement(children, { key: i }));
									} else {
										result.push(children);
									}
								}
							} catch (error) {
								console.error(`Error rendering tag <${tagName}>:`, error);
								result.push(children);
							}

							i = closingIndex + closingTag.length;
							continue;
						}
					}
				}
			}
		}

		textBuffer += message[i];
		i++;
	}

	flushBuffer();

	if (result.length === 0) return "";
	if (result.length === 1 && typeof result[0] === "string") return result[0];

	if (!isRich) {
		return result.map(String).join("");
	}

	return result;
}

////////////////////////////////////////////////////////////////////////////////

type TranslationValue = string | number | Date | ReactNode;
type TranslationValues = Record<string, TranslationValue>;
type RichTranslationValues = Record<
	string,
	((chunks: ReactNode) => ReactNode) | TranslationValue
>;
type MarkupTranslationValues = Record<
	string,
	((chunks: string) => string) | TranslationValue
>;

export interface Translations {
	(key: string, values?: TranslationValues): string;
	rich(key: string, values?: RichTranslationValues): ReactNode;
	markup(key: string, values?: MarkupTranslationValues): string;
	raw(key: string): any;
}

/**
 * Base translation function generator.
 */
export function translations(
	messages: AbstractIntlMessages,
	locale: string,
	namespace?: string,
) {
	// NOTE(joel): Resolve the namespace messages.
	const namespaceMessages = namespace
		? getNestedMessage(messages, namespace)
		: messages;

	// NOTE(joel): The main translation function.
	const tFn = ((key: string, values?: TranslationValues) => {
		const message = getNestedMessage(namespaceMessages, key);
		if (typeof message !== "string") {
			if (message === undefined)
				return `${namespace ? namespace + "." : ""}${key}`;
			return String(message);
		}
		return formatMessage(message, values || {}, locale, false) as string;
	}) as Translations;

	// NOTE(joel): Returns React nodes for rich text formatting.
	tFn.rich = (key: string, values?: RichTranslationValues) => {
		const message = getNestedMessage(namespaceMessages, key);
		if (typeof message !== "string") {
			return `${namespace ? namespace + "." : ""}${key}`;
		}
		const result = formatMessage(message, values || {}, locale, true);
		return result;
	};

	// NOTE(joel): Returns a string with markup tags.
	tFn.markup = (key: string, values?: MarkupTranslationValues) => {
		const message = getNestedMessage(namespaceMessages, key);
		if (typeof message !== "string") {
			return `${namespace ? namespace + "." : ""}${key}`;
		}
		const result = formatMessage(message, values || {}, locale, true);
		// oxlint-disable typescript-eslint/no-base-to-string
		if (Array.isArray(result)) return result.join("");
		return String(result);
	};

	// NOTE(joel): Returns the raw message value without formatting.
	tFn.raw = (key: string) => {
		return getNestedMessage(namespaceMessages, key);
	};

	return tFn as Translations;
}

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): RTL language helpers.
// @see https://en.wikipedia.org/wiki/Right-to-left
const BIDI_RTL_LANGS = new Set<string>([
	"ae", // Avestan
	"ar", // Arabic
	"arc", // Aramaic
	"bcc", // Southern Balochi
	"bqi", // Bakthiari
	"ckb", // Sorani
	"dv", // Dhivehi
	"fa", // Persian
	"glk", // Gilaki
	"he", // Hebrew
	"ku", // Kurdish
	"mzn", // Mazanderani
	"nqo", // N'Ko
	"pnb", // Western Punjabi
	"prs", // Darī
	"ps", // Pashto
	"sd", // Sindhi
	"ug", // Uyghur
	"ur", // Urdu
	"yi", // Yiddish
]);

/**
 * Determines if the given locale corresponds to a right-to-left language.
 */
export function getDirFromLocale(locale: string) {
	let dir = "ltr";

	// Accepts: "ar", "ar-EG", "ar_EG", and more specific tags like "zh-Hant-TW".
	if (!locale) return dir;

	const normalized = String(locale).trim();
	if (!normalized) return dir;

	// First subtag is the language. We keep this intentionally permissive.
	const [langRaw] = normalized.split(/[-_]/);
	const lang = (langRaw || "").toLowerCase();
	if (!lang) return dir;

	if (BIDI_RTL_LANGS.has(lang)) {
		dir = "rtl";
	}

	return dir;
}
