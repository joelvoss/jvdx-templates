import {
	defaultLocale,
	type Locale,
	supportedLocales,
} from "~/lib/i18n/config";

import de from "./de";
import en from "./en";

////////////////////////////////////////////////////////////////////////////////

export type AppMessages = typeof en;

export const messages: Record<Locale, AppMessages> = { en, de };

export { defaultLocale, supportedLocales };
