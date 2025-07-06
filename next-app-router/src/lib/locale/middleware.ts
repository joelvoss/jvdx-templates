import 'server-only';

import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
	LOCALE_COOKIE_MAXAGE,
	LOCALE_COOKIE_NAME,
	LOCALE_HEADER_NAME,
	LOCALE_SEARCHPARAM_NAME,
} from '@/constants';
import { matchLocale } from '@/lib/locale/match-locale';
import { preferredLanguages } from '@/lib/locale/preferred-languages';
import { defaultLocale, locales } from '@/locales';
import type { ChainableMiddleware } from '@/types';

////////////////////////////////////////////////////////////////////////////////

/**
 * Handle the locale for a request and either redirect or continue.
 */
export function withLocale(next: ChainableMiddleware): ChainableMiddleware {
	return async (request: NextRequest, event: NextFetchEvent) => {
		const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
		const locale = request.nextUrl.searchParams.get(LOCALE_SEARCHPARAM_NAME);

		if (locale == null) {
			if (cookieLocale == null) {
				// NOTE(joel): Set the default locale since no locale is set in the
				// request or cookie.
				const response = await next(request, event);
				response.headers.set(LOCALE_HEADER_NAME, defaultLocale);
				response.cookies.set(LOCALE_COOKIE_NAME, defaultLocale, {
					maxAge: LOCALE_COOKIE_MAXAGE,
				});
				return response;
			}

			if (cookieLocale !== defaultLocale) {
				// NOTE(joel): A locale other than the default locale is set in the
				// cookie, so we need to set the locale in the request URL and redirect.
				request.nextUrl.searchParams.set(LOCALE_SEARCHPARAM_NAME, cookieLocale);

				const response = NextResponse.redirect(request.nextUrl, {
					...request,
					status: 302,
				});
				response.headers.set(LOCALE_HEADER_NAME, cookieLocale);
				response.cookies.set(LOCALE_COOKIE_NAME, cookieLocale, {
					maxAge: LOCALE_COOKIE_MAXAGE,
				});
				return response;
			}

			// NOTE(joel): The cookie locale is the default locale, so we can just
			// continue to the next request handler.
			const response = await next(request, event);
			response.headers.set(LOCALE_HEADER_NAME, cookieLocale);
			response.cookies.set(LOCALE_COOKIE_NAME, cookieLocale, {
				maxAge: LOCALE_COOKIE_MAXAGE,
			});
			return response;
		}

		if (!locales.includes(locale)) {
			// NOTE(joel): The locale of the request is not in the list of supported
			// locales, so we try to match it with the preferred languages coming from
			// the request header 'accept-language'.
			// We have to clone the request headers so we can modify them.
			const requestHeaders = new Headers(request.headers);
			const languages = preferredLanguages(
				requestHeaders.get('accept-language'),
			);
			const locale = matchLocale(languages, locales, defaultLocale);
			request.nextUrl.searchParams.set(LOCALE_SEARCHPARAM_NAME, locale);

			const response = NextResponse.redirect(request.nextUrl, {
				...request,
				status: 302,
			});
			response.headers.set(LOCALE_HEADER_NAME, locale);
			response.cookies.set(LOCALE_COOKIE_NAME, locale, {
				maxAge: LOCALE_COOKIE_MAXAGE,
			});
			return response;
		}

		if (locale === defaultLocale) {
			// NOTE(joel): Remove the locale from the URL since it is the default
			// locale.
			request.nextUrl.searchParams.delete(LOCALE_SEARCHPARAM_NAME);
			const response = NextResponse.redirect(request.nextUrl, {
				...request,
				status: 302,
			});
			response.headers.set(LOCALE_HEADER_NAME, locale);
			response.cookies.set(LOCALE_COOKIE_NAME, locale, {
				maxAge: LOCALE_COOKIE_MAXAGE,
			});
			return response;
		}

		const response = await next(request, event);
		response.headers.set(LOCALE_HEADER_NAME, locale);
		response.cookies.set(LOCALE_COOKIE_NAME, locale, {
			maxAge: LOCALE_COOKIE_MAXAGE,
		});
		return response;
	};
}
