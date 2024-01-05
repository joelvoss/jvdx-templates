import 'server-only';

import { NextResponse } from 'next/server';
import { preferredLanguages } from '@/lib/locale/preferred-languages';
import { matchLocale } from '@/lib/locale/match-locale';
import { defaultLocale, locales } from '@/locales';
import {
	LOCALE_COOKIE_MAXAGE,
	LOCALE_COOKIE_NAME,
	LOCALE_HEADER_NAME,
	LOCALE_SEARCHPARAM_NAME,
} from '@/constants';

import type { NextRequest } from 'next/server';
import type { NextURL } from 'next/dist/server/web/next-url';

////////////////////////////////////////////////////////////////////////////////

/**
 * Handle the locale for a request and either redirect or continue.
 */
export function handleRequestLocale(
	request: NextRequest,
	response: NextResponse,
) {
	const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
	const locale = request.nextUrl.searchParams.get(LOCALE_SEARCHPARAM_NAME);

	if (locale == null) {
		if (cookieLocale == null) {
			return next(response, defaultLocale);
		}

		if (cookieLocale !== defaultLocale) {
			request.nextUrl.searchParams.set(LOCALE_SEARCHPARAM_NAME, cookieLocale);
			return redirect(response, request.nextUrl, cookieLocale);
		}

		return next(response, cookieLocale);
	}

	if (!locales.includes(locale)) {
		// NOTE(joel): Clone the request headers so we can modify them.
		const requestHeaders = new Headers(request.headers);
		const languages = preferredLanguages(requestHeaders.get('accept-language'));
		const locale = matchLocale(languages, locales, defaultLocale);
		request.nextUrl.searchParams.set(LOCALE_SEARCHPARAM_NAME, locale);
		return redirect(response, request.nextUrl, locale);
	}

	if (locale === defaultLocale) {
		request.nextUrl.searchParams.delete(LOCALE_SEARCHPARAM_NAME);
		return redirect(response, request.nextUrl, locale);
	}

	return next(response, locale);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Redirect to a new URL and set the locale in the response headers and cookies.
 */
function redirect(response: NextResponse, url: NextURL, locale: string) {
	const r = NextResponse.redirect(url, { ...response, status: 302 });
	r.headers.set(LOCALE_HEADER_NAME, locale);
	r.cookies.set(LOCALE_COOKIE_NAME, locale, {
		maxAge: LOCALE_COOKIE_MAXAGE,
	});
	return r;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Continue to the next request handler and set the locale in the response
 * headers.
 */
function next(response: NextResponse, locale: string) {
	const r = NextResponse.next(response);
	r.headers.set(LOCALE_HEADER_NAME, locale);
	r.cookies.set(LOCALE_COOKIE_NAME, locale, {
		maxAge: LOCALE_COOKIE_MAXAGE,
	});
	return r;
}
