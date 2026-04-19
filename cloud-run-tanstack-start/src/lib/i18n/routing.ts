import { extractLocaleFromPath, shouldIgnorePath } from "~/lib/i18n/locale";
import { getCurrentLocale } from "~/lib/i18n/runtime";

////////////////////////////////////////////////////////////////////////////////

/**
 * Removes the locale segment from the given URL's pathname if it exists. It
 * first checks if the pathname should be ignored for locale extraction (e.g.,
 * API routes). If not, it attempts to extract the locale from the pathname. If
 * a valid locale is found, it creates a new URL object with the locale segment
 * removed from the pathname and returns it. If no locale is found or if the
 * path should be ignored, it returns the original URL.
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
 * Adds the current locale to the given URL's pathname if it is not the default
 * locale. It first checks if the pathname should be ignored for locale
 * extraction (e.g., API routes). If not, it retrieves the current locale and
 * checks if it is the default locale. If it is not the default locale, it
 * creates a new URL object with the locale segment added to the beginning of
 * the pathname and returns it. If the current locale is the default locale or
 * if the path should be ignored, it returns the original URL.
 */
export function localizeUrl(url: URL): URL {
	if (shouldIgnorePath(url.pathname)) return url;

	const { locale, isDefault } = getCurrentLocale();
	if (isDefault) return url;

	const newUrl = new URL(url);
	newUrl.pathname = `/${locale}${url.pathname === "/" ? "" : url.pathname}`;
	return newUrl;
}
