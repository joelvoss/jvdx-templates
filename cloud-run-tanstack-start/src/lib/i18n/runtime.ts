import {
	createIsomorphicFn,
	createServerFn,
	createServerOnlyFn,
} from "@tanstack/react-start";
import { getCookie, getRequest } from "@tanstack/react-start/server";
import * as v from "valibot";

import {
	defaultLocale,
	I18N_COOKIE_NAME,
	I18N_WINDOW_KEY,
	type AbstractIntlMessages,
	type Locale,
} from "~/lib/i18n/config";
import {
	extractLocaleFromPath,
	isValidLocale,
	parseLocaleCookie,
	shouldIgnorePath,
} from "~/lib/i18n/locale";
import { messages } from "~/translations";

////////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves the current locale and whether it is the default locale. It uses
 * an isomorphic function to determine the locale on both the server and client
 * sides. On the server, it checks the request URL and cookies to determine the
 * locale, while on the client, it checks the window location and cookies. The
 * function returns an object containing the current locale and a boolean
 * indicating if it is the default locale.
 */
export const getCurrentLocale = createIsomorphicFn()
	.server(() => {
		const request = getRequest();
		const url = new URL(request.url);

		let locale: string;
		if (shouldIgnorePath(url.pathname)) {
			locale = getCookie(I18N_COOKIE_NAME) ?? defaultLocale;
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
 * Server function to retrieve the messages for a specific locale. It takes a
 * locale as input and returns the corresponding messages from the `messages`
 * object. If the requested locale does not exist in the `messages` object, it
 * returns an empty object.
 */
export const getMessagesFn = createServerFn({ method: "GET" })
	.inputValidator(GetMessagesSchema)
	.handler(({ data }) => messages[data.locale as Locale] || {});

////////////////////////////////////////////////////////////////////////////////

/**
 * Isomorphic function to retrieve the current messages for the active locale.
 * It uses the `getMessagesFn` server function to fetch the messages based on
 * the current locale determined by the `getCurrentLocale` function. On the
 * client side, it also checks if the messages are already available in the
 * global window object (under the key defined by `I18N_WINDOW_KEY`) to avoid
 * unnecessary server calls. If the messages are not available in the window
 * object, it fetches them from the server using `getMessagesFn`.
 */
export const getCurrentMessages = createIsomorphicFn()
	.server(async (locale) => {
		return getMessagesFn({ data: { locale } });
	})
	.client(async (locale) => {
		if (I18N_WINDOW_KEY in window && window[I18N_WINDOW_KEY]) {
			return window[I18N_WINDOW_KEY] as AbstractIntlMessages;
		}

		return getMessagesFn({ data: { locale } });
	});

////////////////////////////////////////////////////////////////////////////////

/**
 * Middleware function to handle locale detection and redirection on the server
 * side. It checks the incoming request's URL and cookies to determine the
 * appropriate locale. If the URL contains a locale segment that is not the
 * default locale, it ensures that the locale is set in the cookies. If the URL
 * contains the default locale segment, it redirects to the URL without the
 * locale segment.
 */
export const i18nMiddleware = createServerOnlyFn((request: Request) => {
	const url = new URL(request.url);
	const pathname = url.pathname;

	if (shouldIgnorePath(pathname)) return {};

	if (
		pathname.startsWith(`/${defaultLocale}/`) ||
		pathname === `/${defaultLocale}`
	) {
		url.pathname = pathname.replace(`/${defaultLocale}`, "") || "/";
		return { redirect: Response.redirect(url.toString(), 301) };
	}

	const urlLocale = extractLocaleFromPath(pathname);
	if (urlLocale) {
		const strippedPath = pathname.replace(`/${urlLocale}`, "") || "/";
		if (shouldIgnorePath(strippedPath)) {
			url.pathname = strippedPath;
			return { redirect: Response.redirect(url.toString(), 301) };
		}

		const cookieLocale = parseLocaleCookie(request.headers.get("cookie"));
		if (urlLocale !== cookieLocale) {
			return {
				setCookie: `${I18N_COOKIE_NAME}=${encodeURIComponent(urlLocale)}; Path=/; HttpOnly; SameSite=Lax`,
			};
		}
	}

	return {};
});
