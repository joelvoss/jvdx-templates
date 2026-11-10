import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getCookie, setCookie } from "@tanstack/react-start/server";

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

/**
 * Returns the session secret used for signing the anonymous session cookie. In
 * production, this must be set via the SESSION_SECRET environment variable and
 * be at least 32 characters long. In development, a fallback secret is used.
 */
function getSessionPassword() {
	const secret = process.env.SESSION_SECRET;
	if (process.env.NODE_ENV === "production") {
		if (!secret || secret.length < 32) {
			throw new Error(
				"SESSION_SECRET must be set to at least 32 characters in production",
			);
		}
		return secret;
	}
	return secret || SESSION_SECRET_FALLBACK;
}

////////////////////////////////////////////////////////////////////////////////

type AnonymousSession = {
	csrfToken: string;
	expiresAt: number;
};

////////////////////////////////////////////////////////////////////////////////

function readSignedSession(secret: string): AnonymousSession | undefined {
	const cookie = getCookie(SESSION_COOKIE_NAME);
	if (!cookie) return;

	const parts = cookie.split(".");
	if (parts.length !== 2) return;
	const [payload, signature] = parts;
	if (!payload || !signature || !/^[\w-]+$/.test(payload)) return;

	const expectedSignature = createHmac("sha256", secret)
		.update(payload)
		.digest("base64url");
	if (!safeEqual(signature, expectedSignature)) return;

	try {
		const data: unknown = JSON.parse(
			Buffer.from(payload, "base64url").toString("utf8"),
		);
		if (
			typeof data === "object" &&
			data !== null &&
			"csrfToken" in data &&
			typeof data.csrfToken === "string" &&
			/^[\w-]{32}$/.test(data.csrfToken) &&
			"expiresAt" in data &&
			typeof data.expiresAt === "number" &&
			Number.isSafeInteger(data.expiresAt) &&
			data.expiresAt > Date.now()
		) {
			return { csrfToken: data.csrfToken, expiresAt: data.expiresAt };
		}
	} catch {
		return;
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Ensures the current request has an anonymous signed session and a CSRF token
 * bound to that session. The readable CSRF cookie exists only as a mirror of
 * the signed session state so the browser app can echo it in `x-app-csrf`.
 */
export function ensureAnonymousSession() {
	const secret = getSessionPassword();
	let session = readSignedSession(secret);

	if (!session) {
		session = {
			csrfToken: randomBytes(CSRF_BYTES).toString("base64url"),
			expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
		};
		const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
		const signature = createHmac("sha256", secret)
			.update(payload)
			.digest("base64url");
		setCookie(SESSION_COOKIE_NAME, `${payload}.${signature}`, {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			httpOnly: true,
			path: "/",
			maxAge: SESSION_MAX_AGE_SECONDS,
		});
	}

	setCookie(csrfCookieName, session.csrfToken, {
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		httpOnly: false,
		path: "/",
		maxAge: Math.ceil((session.expiresAt - Date.now()) / 1000),
	});

	return session;
}

////////////////////////////////////////////////////////////////////////////////

export function validateMutationRequestForServerFn(
	request: Request,
	csrfToken?: string,
) {
	if (request.headers.get(SERVER_FN_HEADER) !== "true") return null;
	if (request.method === "GET") return null;

	return validateMutationRequest(request, csrfToken);
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
