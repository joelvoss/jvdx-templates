import { ScriptOnce } from "@tanstack/react-router";
import { createContext, useContext, type ReactNode, useMemo } from "react";

import { type AbstractIntlMessages, translations, windowKey } from "~/lib/i18n";

////////////////////////////////////////////////////////////////////////////////

type IntlContextValue = {
	locale: string;
	messages: AbstractIntlMessages;
	timeZone?: string;
};

////////////////////////////////////////////////////////////////////////////////

export const I18nContext = createContext<IntlContextValue | null>(null);

////////////////////////////////////////////////////////////////////////////////

/**
 * IntlProvider Component that provides internationalization context to its
 * children.
 */
export function I18nProvider({
	children,
	locale,
	messages,
	timeZone,
}: {
	children: ReactNode;
	locale: string;
	messages: AbstractIntlMessages;
	timeZone?: string;
}) {
	return (
		<I18nContext.Provider value={{ locale, messages, timeZone }}>
			{children}
		</I18nContext.Provider>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Hook to get the translation function.
 */
export function useTranslations(namespace?: string) {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("useTranslations must be used within an IntlProvider");
	}

	const { messages, locale } = context;

	return useMemo(() => {
		return translations(messages, locale, namespace);
	}, [messages, locale, namespace]);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Component that renders the current locale's messages as a script tag for
 * hydration on the client. This allows us to avoid an extra round trip to
 * fetch messages on the client.
 */
export function I18nScript() {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("I18nScript must be used within an IntlProvider");
	}

	const { messages } = context;

	return (
		<ScriptOnce>
			{`window.${windowKey} = ${JSON.stringify(messages)};`}
		</ScriptOnce>
	);
}
