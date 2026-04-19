export const csrfCookieName = "__app_csrf";

// Mutations must reflect the CSRF cookie value in this header so the server can
// verify the request came through our application code, not just with cookies.
export const csrfHeaderName = "x-app-csrf";

////////////////////////////////////////////////////////////////////////////////

/**
 * Reads and decodes a cookie value from a raw Cookie header string.
 */
export function readCookie(cookieString: string | null, name: string) {
	if (!cookieString) return null;

	for (const cookie of cookieString.split(";")) {
		const trimmed = cookie.trim();
		const separatorIndex = trimmed.indexOf("=");
		if (separatorIndex === -1) continue;

		if (trimmed.slice(0, separatorIndex) !== name) continue;

		try {
			return decodeURIComponent(trimmed.slice(separatorIndex + 1));
		} catch {
			return null;
		}
	}

	return null;
}
