import { useRouterState } from "@tanstack/react-router";

import { clsx } from "~/lib/clsx";
import { getCurrentLocale, shouldIgnorePath, type Locale } from "~/lib/i18n";
import { useTranslations } from "~/shared/i18n";
import { defaultLocale, supportedLocales } from "~/translations";

////////////////////////////////////////////////////////////////////////////////

/**
 * A language switcher component that allows users to switch between available
 * locales. It generates localized URLs based on the current path and locale.
 * Languages changes trigger a full page reload to ensure proper localization.
 */
export function LanguageSwitcher() {
	const t = useTranslations("shared.navigation");
	const { locale } = getCurrentLocale();
	const location = useRouterState({ select: (s) => s.location });

	// NOTE(joel): Use a fixed base because only pathname, search, and hash are
	// returned to the anchor. This keeps URL construction safe during server
	// rendering.
	const currentUrl = new URL(location.publicHref || "/", "http://localhost");
	const basePathname = stripAnyLocalePrefix(currentUrl.pathname);

	// NOTE(joel): If we are on an ignored path (e.g. /api), don't try to
	// localize it. This component normally won't render there, but keep it safe.
	if (shouldIgnorePath(basePathname)) {
		return null;
	}

	const hrefs = supportedLocales.map((targetLocale) => ({
		locale: targetLocale,
		href: addLocalePrefix(basePathname, targetLocale, currentUrl),
	}));

	return (
		<div
			className="inline-flex rounded-md border border-gray-200 bg-white p-0.5"
			role="group"
			aria-label={t("language.label")}
		>
			{hrefs.map((href) => (
				<a
					key={href.locale}
					href={href.href}
					aria-current={href.locale === locale ? "page" : undefined}
					className={clsx(
						"rounded-sm px-2 py-1 text-xs font-medium transition-colors",
						href.locale === locale
							? "bg-sky-600 text-white"
							: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
					)}
				>
					{t(`language.${href.locale}`)}
				</a>
			))}
		</div>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if the given pathname has the specified locale prefix.
 */
function hasLocalePrefix(pathname: string, locale: string) {
	return pathname === `/${locale}` || pathname.startsWith(`/${locale}/`);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Removes any locale prefix from the pathname.
 */
function stripAnyLocalePrefix(pathname: string) {
	for (const locale of supportedLocales) {
		if (!hasLocalePrefix(pathname, locale)) continue;
		let stripped = pathname.replace(new RegExp(`^/${locale}`), "");
		if (!stripped.startsWith("/")) stripped = "/" + stripped;
		return stripped;
	}
	return pathname;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Adds locale prefix to the pathname if not already present.
 */
function addLocalePrefix(pathname: string, locale: Locale, currentUrl: URL) {
	const localizedPath =
		locale === defaultLocale
			? pathname
			: pathname === "/"
				? `/${locale}`
				: `/${locale}${pathname}`;
	const url = new URL(currentUrl);
	url.pathname = localizedPath;
	return url.pathname + url.search + url.hash;
}
