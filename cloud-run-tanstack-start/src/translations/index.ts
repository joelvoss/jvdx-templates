import { type AbstractIntlMessages, type Locale } from "~/lib/i18n";

import de from "./de";
import en from "./en";

////////////////////////////////////////////////////////////////////////////////

export const defaultLocale = "en";
export const supportedLocales = ["en", "de"] as const;

export const messages: Record<Locale, AbstractIntlMessages> = { en, de };
