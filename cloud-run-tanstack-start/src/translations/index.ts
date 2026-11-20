import {
	defaultLocale,
	type Locale,
	supportedLocales,
} from "~/lib/i18n/config";

import de from "./de";
import en from "./en";

////////////////////////////////////////////////////////////////////////////////

type MessageShape<T> = {
	[K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};

export type AppMessages = MessageShape<typeof en>;

export const messages: Record<Locale, AppMessages> = { en, de };

export { defaultLocale, supportedLocales };
