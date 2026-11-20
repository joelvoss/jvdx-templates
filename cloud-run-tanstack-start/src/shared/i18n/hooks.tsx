import { useContext, useMemo } from "react";

import { I18nContext, translations } from "~/shared/i18n";
import type {
	NamespacePaths,
	ScopedMessageKeys,
	Translations,
} from "~/shared/i18n/translations";
import type { AppMessages } from "~/translations";

////////////////////////////////////////////////////////////////////////////////

/**
 * Hook to get the translation function.
 */
export function useTranslations<
	N extends NamespacePaths<AppMessages> | undefined = undefined,
>(namespace?: N): Translations<ScopedMessageKeys<AppMessages, N>> {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("useTranslations must be used within an I18nProvider");
	}

	const { messages, locale } = context;

	return useMemo(() => {
		return translations(messages, locale, namespace);
	}, [messages, locale, namespace]);
}
