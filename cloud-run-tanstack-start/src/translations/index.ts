import {
	type AbstractIntlMessages,
	defaultLocale,
	type Locale,
	supportedLocales,
} from "~/lib/i18n/config";

import de from "./de";
import en from "./en";

////////////////////////////////////////////////////////////////////////////////

export const messages: Record<Locale, AbstractIntlMessages> = { en, de };

export { defaultLocale, supportedLocales };
