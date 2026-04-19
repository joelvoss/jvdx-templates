import { randomBytes, timingSafeEqual } from "node:crypto";

import { setCookie, useSession } from "@tanstack/react-start/server";

import { csrfCookieName, csrfHeaderName } from "~/lib/cookies";

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): Session secret must be 32+ characters for secure cookie signing.
// In production, you should set a strong secret via the SESSION_SECRET
// environment variable. The fallback is only for development and should be
// changed before deploying to production.
const SESSION_SECRET_FALLBACK = "dev-only-session-secret-change-me-1234567890";
const SESSION_COOKIE_NAME = "__app_session";
const SERVER_FN_HEADER = "x-tsr-serverfn";
const CSRF_BYTES = 24;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

////////////////////////////////////////////////////////////////////////////////

type AppSessionData = {
	csrfToken?: string;
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the signed anonymous browser session used by the app.
 * TanStack seals it with the server secret, so clients cannot forge or tamper
 * with its contents. We store the CSRF token inside that signed session, then
 * mirror the same token into a readable cookie for the app to reflect into a
 * mutation header.
 */
export function useAppSession() {
	return useSession<AppSessionData>({
		name: SESSION_COOKIE_NAME,
		password: process.env.SESSION_SECRET || SESSION_SECRET_FALLBACK,
		maxAge: SESSION_MAX_AGE_SECONDS,
		cookie: {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			httpOnly: true,
			path: "/",
		},
	});
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Ensures the current request has an anonymous signed session and a CSRF token
 * bound to that session. The readable CSRF cookie exists only as a mirror of
 * the signed session state so the browser app can echo it in `x-app-csrf`.
 */
export async function ensureAnonymousSession() {
	const session = await useAppSession();
	let csrfToken = session.data.csrfToken;

	if (!csrfToken) {
		csrfToken = randomBytes(CSRF_BYTES).toString("base64url");
		await session.update({ csrfToken });
	}

	setCookie(csrfCookieName, csrfToken, {
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		httpOnly: false,
		path: "/",
		maxAge: SESSION_MAX_AGE_SECONDS,
	});

	return { session, csrfToken };
}

////////////////////////////////////////////////////////////////////////////////

export async function validateMutationRequestForServerFn(request: Request) {
	if (request.headers.get(SERVER_FN_HEADER) !== "true") return null;
	if (request.method === "GET") return null;

	const { session } = await ensureAnonymousSession();
	return validateMutationRequest(request, session.data.csrfToken);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Validates the incoming mutation request against the session's CSRF token and
 * the request's origin. Returns a string describing the violation if invalid,
 * or null if the request is valid.
 */
function validateMutationRequest(request: Request, csrfToken?: string) {
	if (!csrfToken) return "Missing session";

	if (!isAllowedOrigin(request)) return "Invalid origin";

	const csrfHeader = request.headers.get(csrfHeaderName);
	if (!csrfHeader) return "Missing CSRF token";

	if (!safeEqual(csrfHeader, csrfToken)) return "Invalid CSRF token";

	return null;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if the request's origin is allowed by comparing the 'Origin' header to
 * the request URL's origin. Also checks the 'Sec-Fetch-Site' header to ensure
 * it's a same-origin request. This helps prevent CSRF attacks by ensuring that
 * the request is coming from the same site.
 */
function isAllowedOrigin(request: Request) {
	const url = new URL(request.url);
	const origin = request.headers.get("origin");
	if (!origin) return false;

	try {
		if (new URL(origin).origin !== url.origin) return false;
	} catch {
		return false;
	}

	const fetchSite = request.headers.get("sec-fetch-site");
	return fetchSite == null || fetchSite === "same-origin";
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Performs a timing-safe comparison of two strings to prevent against timing
 * attacks. This is used to compare the CSRF token from the request header with
 * the token stored in the session without leaking timing information that
 * could be exploited by an attacker.
 */
function safeEqual(left: string, right: string) {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);
	if (leftBuffer.length !== rightBuffer.length) return false;
	return timingSafeEqual(leftBuffer, rightBuffer);
}
