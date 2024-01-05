export const LOCALE_SEARCHPARAM_NAME = 'hl';
export const LOCALE_HEADER_NAME = `x-${LOCALE_SEARCHPARAM_NAME}`;
export const LOCALE_COOKIE_NAME = '__hl';
export const LOCALE_COOKIE_MAXAGE = 5 * 86400; // 5 days

export const CSRF_HEADER_TOKEN = 'x-csrf-token';
export const CSRF_HEADER_VERIFIED = 'x-csrf-verified';
export const CSRF_COOKIE_NAME = '__csrf';
export const CSRF_BODY_NAME = '__csrf';
export const CSRF_HEAD_NAME = 'csrf';
export const CSRF_SECRET = '<CHANGE ME>';
