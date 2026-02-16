import { useRouterState } from "@tanstack/react-router";

import { clsx } from "~/lib/clsx";
import { getCurrentLocale, shouldIgnorePath } from "~/lib/i18n";
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

	const pathname = location.publicHref || "/";
	const basePathname = stripAnyLocalePrefix(pathname);

	// NOTE(joel): If we are on an ignored path (e.g. /api), don't try to
	// localize it. This component normally won't render there, but keep it safe.
	if (shouldIgnorePath(basePathname)) {
		return null;
	}

	const hrefs = [
		{ locale: "en", pathname: addLocalePrefix(basePathname, "en") },
		{ locale: "de", pathname: addLocalePrefix(basePathname, "de") },
	];

	return (
		<div
			className="inline-flex rounded-md border border-gray-200 bg-white p-0.5"
			role="group"
			aria-label={t("language.label")}
		>
			{hrefs.map((href) => (
				<a
					key={href.locale}
					href={href.pathname}
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
	return pathname === `/${locale}` || pathname.startsWith(`/${locale}`);
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
function addLocalePrefix(pathname: string, locale: string) {
	if (locale === defaultLocale) return pathname;
	if (hasLocalePrefix(pathname, locale)) return pathname;

	if (pathname === "/") return `/${locale}`;
	return `/${locale}${pathname}`;
}
