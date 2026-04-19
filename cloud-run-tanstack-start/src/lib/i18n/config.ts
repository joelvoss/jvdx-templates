export const defaultLocale = "en";
export const supportedLocales = ["en", "de"] as const;

export type Locale = (typeof supportedLocales)[number];
export type AbstractIntlMessages = {
	[key: string]: string | AbstractIntlMessages;
};

////////////////////////////////////////////////////////////////////////////////

export const I18N_WINDOW_KEY = `$__app_i18n`;
export const I18N_COOKIE_NAME = "__app_locale";
