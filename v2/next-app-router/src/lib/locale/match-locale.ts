// - `-u` matches the literal string "-u". In the context of locale
// identifiers, "-u" is used to introduce a Unicode extension sequence.
// - `(?:-[0-9a-z]{2,8})+` is a non-capturing group that matches a dash
// followed by between 2 and 8 alphanumeric characters. This represents the
// key-value pairs that make up the Unicode extension sequence. The `{2,8}`
// quantifier means that there should be at least 2 and at most 8 such
// characters. The `+` after the group means that this group can appear one
// or more times.
// Example matches: "-u-ca-gregory-co-trad", "-u-kf-upper", etc.
const UNICODE_EXTENSION_SEQUENCE_REGEXP = /-u(?:-[0-9a-z]{2,8})+/gi;

/**
 * Match the requested locales against the available locales and return the best
 * available locale.
 */
export function matchLocale(
	requestedLocales: string[],
	availableLocales: string[],
	defaultLocale: string,
) {
	const canonicalRequestedLocales = (Intl as any).getCanonicalLocales(
		requestedLocales,
	);
	const locales = new Set(availableLocales);

	const minimizedAvailableLocaleMap: Record<string, string> = {};
	const availableLocaleMap: Record<string, string> = {};
	const canonicalizedLocaleMap: Record<string, string> = {};
	const minimizedAvailableLocales: Set<string> = new Set();

	for (const locale of locales) {
		const minimizedLocale = new (Intl as any).Locale(locale)
			.minimize()
			.toString();
		const canonicalizedLocale =
			(Intl as any).getCanonicalLocales(locale)[0] || locale;

		minimizedAvailableLocaleMap[minimizedLocale] = locale;
		availableLocaleMap[locale] = locale;
		canonicalizedLocaleMap[canonicalizedLocale] = locale;
		minimizedAvailableLocales.add(minimizedLocale);
		minimizedAvailableLocales.add(locale);
		minimizedAvailableLocales.add(canonicalizedLocale);
	}

	let foundLocale: string | undefined;
	for (const l of canonicalRequestedLocales) {
		const noExtensionLocale = l.replace(UNICODE_EXTENSION_SEQUENCE_REGEXP, '');

		if (locales.has(noExtensionLocale)) {
			foundLocale = noExtensionLocale;
			break;
		}

		if (minimizedAvailableLocales.has(noExtensionLocale)) {
			foundLocale = noExtensionLocale;
			break;
		}

		const locale = new (Intl as any).Locale(noExtensionLocale);
		const maximizedRequestedLocale = locale.maximize().toString();
		const minimizedRequestedLocale = locale.minimize().toString();

		if (minimizedAvailableLocales.has(minimizedRequestedLocale)) {
			foundLocale = minimizedRequestedLocale;
			break;
		}

		foundLocale = lookupMaximizedLocale(
			minimizedAvailableLocales,
			maximizedRequestedLocale,
		);
	}

	if (!foundLocale) return defaultLocale;

	return (
		availableLocaleMap[foundLocale] ||
		canonicalizedLocaleMap[foundLocale] ||
		minimizedAvailableLocaleMap[foundLocale] ||
		foundLocale
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Lookup the maximized locale from the available locales.
 */
function lookupMaximizedLocale(availableLocales: Set<string>, locale: string) {
	let candidate = locale;
	while (true) {
		if (availableLocales.has(candidate)) {
			return candidate;
		}
		let pos = candidate.lastIndexOf('-');
		// NOTE(joel): Return true if `pos` equals -1, false otherwise.
		if (!~pos) {
			return undefined;
		}
		if (pos >= 2 && candidate[pos - 2] === '-') {
			pos -= 2;
		}
		candidate = candidate.slice(0, pos);
	}
}
