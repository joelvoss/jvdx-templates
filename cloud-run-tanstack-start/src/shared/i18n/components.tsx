import { ScriptOnce } from "@tanstack/react-router";
import { createContext, useContext, type ReactNode } from "react";

import { I18N_WINDOW_KEY, type AbstractIntlMessages } from "~/lib/i18n/config";

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
 * This component should be used at the root of your application to provide the
 * internationalization context to all child components. It accepts the locale,
 * messages, and an optional time zone as props and makes them available to the
 * rest of the application through the I18nContext.
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
 * This component should be used inside the <head> of your HTML document to
 * inject the internationalization messages into the global window object. This
 * allows the client-side code to access the messages without making an
 * additional request to the server.
 */
export function I18nScript() {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("I18nScript must be used within an I18nProvider");
	}

	return (
		<ScriptOnce>
			{`window.${I18N_WINDOW_KEY} = ${serializeMessagesForScript(context.messages)};`}
		</ScriptOnce>
	);
}

////////////////////////////////////////////////////////////////////////////////

export function serializeMessagesForScript(messages: AbstractIntlMessages) {
	return JSON.stringify(messages)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/&/g, "\\u0026")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}
