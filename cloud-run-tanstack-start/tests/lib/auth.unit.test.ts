import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	return {
		getCookie: vi.fn(),
		setCookie: vi.fn(),
	};
});

vi.mock("@tanstack/react-start/server", () => {
	return {
		getCookie: mocks.getCookie,
		setCookie: mocks.setCookie,
	};
});

async function importAuth() {
	vi.resetModules();
	return await import("~/lib/auth");
}

////////////////////////////////////////////////////////////////////////////////

const SESSION_SECRET = "test-session-secret-that-is-at-least-32-chars";
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

describe("lib/auth", () => {
	beforeEach(() => {
		vi.stubEnv("NODE_ENV", "test");
		vi.stubEnv("SESSION_SECRET", SESSION_SECRET);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.useRealTimers();
		mocks.getCookie.mockReset();
		mocks.setCookie.mockReset();
	});

	it("bootstraps a csrf token into the signed session when missing", async () => {
		vi.useFakeTimers();
		mocks.getCookie.mockReturnValue(undefined);
		const auth = await importAuth();

		const result = await auth.ensureAnonymousSession();

		expect(result.csrfToken).toBeTruthy();
		expect(result.expiresAt).toBe(Date.now() + SESSION_LIFETIME_MS);
		expect(
			JSON.parse(
				Buffer.from(sessionCookie().split(".")[0], "base64url").toString(),
			),
		).toEqual(result);
		expect(mocks.setCookie).toHaveBeenCalledWith(
			"__app_session",
			expect.stringMatching(/^[\w-]+\.[\w-]+$/),
			expect.objectContaining({
				httpOnly: true,
				sameSite: "lax",
				maxAge: SESSION_LIFETIME_MS / 1000,
			}),
		);
		expect(mocks.setCookie).toHaveBeenCalledWith(
			"__app_csrf",
			expect.any(String),
			expect.objectContaining({
				httpOnly: false,
				sameSite: "lax",
			}),
		);
	});

	it.each(["", "too-short"])(
		"requires a strong production secret (%s)",
		async (secret) => {
			vi.stubEnv("NODE_ENV", "production");
			vi.stubEnv("SESSION_SECRET", secret);
			mocks.getCookie.mockReturnValue(undefined);
			const auth = await importAuth();

			expect(() => auth.ensureAnonymousSession()).toThrow(
				"SESSION_SECRET must be set",
			);
		},
	);

	it("reuses the csrf token already stored in the signed session", async () => {
		const csrfToken = await setUpSignedSession();
		const auth = await importAuth();

		const result = await auth.ensureAnonymousSession();

		expect(result.csrfToken).toBe(csrfToken);
		expect(mocks.getCookie).toHaveBeenCalledExactlyOnceWith("__app_session");
		expect(mocks.setCookie).toHaveBeenCalledTimes(1);
		expect(mocks.setCookie).toHaveBeenCalledWith(
			"__app_csrf",
			csrfToken,
			expect.any(Object),
		);
	});

	it("allows public server function reads without mutation checks", async () => {
		const auth = await importAuth();

		const result = await auth.validateMutationRequestForServerFn(
			new Request("https://example.com/_serverFn", {
				method: "GET",
				headers: { "x-tsr-serverFn": "true" },
			}),
		);

		expect(result).toBeNull();
		expect(mocks.getCookie).not.toHaveBeenCalled();
		expect(mocks.setCookie).not.toHaveBeenCalled();
	});

	it("ignores non-server-function requests without touching cookies", async () => {
		const auth = await importAuth();
		expect(
			auth.validateMutationRequestForServerFn(
				new Request("https://example.com", { method: "POST" }),
			),
		).toBeNull();
		expect(mocks.getCookie).not.toHaveBeenCalled();
		expect(mocks.setCookie).not.toHaveBeenCalled();
	});

	it.each([
		["https://evil.example", "same-origin"],
		["http://example.com", "same-origin"],
		["https://example.com:8443", "same-origin"],
		["not-a-url", "same-origin"],
		[undefined, "same-origin"],
		["https://example.com", "cross-site"],
		["https://example.com", "same-site"],
	])(
		"rejects mutation origin %s with fetch site %s",
		async (origin, fetchSite) => {
			const csrfToken = await setUpSignedSession();
			const auth = await importAuth();

			const result = await auth.validateMutationRequestForServerFn(
				new Request("https://example.com/_serverFn", {
					method: "POST",
					headers: {
						"x-tsr-serverFn": "true",
						...(origin ? { origin } : {}),
						"sec-fetch-site": fetchSite!,
						"x-app-csrf": csrfToken,
					},
				}),
				csrfToken,
			);

			expect(result).toBe("Invalid origin");
		},
	);

	it.each(["same-origin", undefined])(
		"accepts a matching session token with fetch site %s",
		async (fetchSite) => {
			const csrfToken = await setUpSignedSession();
			const auth = await importAuth();

			const result = await auth.validateMutationRequestForServerFn(
				new Request("https://example.com/_serverFn", {
					method: "POST",
					headers: {
						"x-tsr-serverFn": "true",
						origin: "https://example.com",
						...(fetchSite ? { "sec-fetch-site": fetchSite } : {}),
						"x-app-csrf": csrfToken,
					},
				}),
				csrfToken,
			);

			expect(result).toBeNull();
			expect(mocks.getCookie).not.toHaveBeenCalled();
			expect(mocks.setCookie).not.toHaveBeenCalled();
		},
	);

	it.each([
		[undefined, "Missing CSRF token"],
		["wrong-token", "Invalid CSRF token"],
		["x".repeat(32), "Invalid CSRF token"],
	])(
		"rejects missing or mismatched CSRF header %s",
		async (header, violation) => {
			const csrfToken = await setUpSignedSession();
			const auth = await importAuth();
			const request = new Request("https://example.com/_serverFn", {
				method: "POST",
				headers: {
					"x-tsr-serverFn": "true",
					origin: "https://example.com",
					...(header ? { "x-app-csrf": header } : {}),
				},
			});
			expect(auth.validateMutationRequestForServerFn(request, csrfToken)).toBe(
				violation,
			);
		},
	);

	it("rejects a mutation without initialized session state", async () => {
		const auth = await importAuth();
		expect(
			auth.validateMutationRequestForServerFn(
				new Request("https://example.com/_serverFn", {
					method: "POST",
					headers: {
						"x-tsr-serverFn": "true",
						origin: "https://example.com",
						"x-app-csrf": "forged-token",
					},
				}),
			),
		).toBe("Missing session");
		expect(mocks.getCookie).not.toHaveBeenCalled();
		expect(mocks.setCookie).not.toHaveBeenCalled();
	});

	it.each(["payload", "signature", "secret"])(
		"replaces a session with a tampered %s and rejects replayed CSRF",
		async (part) => {
			const csrfToken = await setUpSignedSession();
			const [payload, signature] = mocks.getCookie().split(".");
			if (part === "payload") {
				const data = JSON.parse(Buffer.from(payload, "base64url").toString());
				data.csrfToken = "x".repeat(32);
				mocks.getCookie.mockReturnValue(
					`${Buffer.from(JSON.stringify(data)).toString("base64url")}.${signature}`,
				);
			} else if (part === "signature") {
				mocks.getCookie.mockReturnValue(
					`${payload}.${signature.startsWith("a") ? "b" : "a"}${signature.slice(1)}`,
				);
			} else {
				vi.stubEnv(
					"SESSION_SECRET",
					"another-session-secret-at-least-32-chars",
				);
			}
			const auth = await importAuth();
			const result = auth.ensureAnonymousSession();
			expect(result.csrfToken).not.toBe(csrfToken);
			expect(mocks.setCookie).toHaveBeenCalledTimes(2);
			expect(
				auth.validateMutationRequestForServerFn(
					new Request("https://example.com/_serverFn", {
						method: "POST",
						headers: {
							"x-tsr-serverFn": "true",
							origin: "https://example.com",
							"x-app-csrf": csrfToken,
						},
					}),
					result.csrfToken,
				),
			).toBe("Invalid CSRF token");
		},
	);

	it.each([
		"garbage",
		".signature",
		"payload.",
		"payload.signature.extra",
		"payload.signature.",
		"%%%%.signature",
	])("replaces malformed cookie %s", async (cookie) => {
		mocks.getCookie.mockReturnValue(cookie);
		const auth = await importAuth();
		expect(auth.ensureAnonymousSession().csrfToken).toHaveLength(32);
		expect(mocks.setCookie).toHaveBeenCalledTimes(2);
	});

	it.each([
		"not json",
		"null",
		"[]",
		JSON.stringify({ csrfToken: "x".repeat(32) }),
		JSON.stringify({ csrfToken: 123, expiresAt: 4102444800000 }),
		JSON.stringify({ csrfToken: "", expiresAt: 4102444800000 }),
		JSON.stringify({ csrfToken: "x".repeat(32), expiresAt: "4102444800000" }),
		JSON.stringify({ csrfToken: "x".repeat(32), expiresAt: 4102444800000.5 }),
	])("replaces signed but invalid session data %s", async (json) => {
		const payload = Buffer.from(json).toString("base64url");
		const signature = createHmac("sha256", SESSION_SECRET)
			.update(payload)
			.digest("base64url");
		mocks.getCookie.mockReturnValue(`${payload}.${signature}`);
		const auth = await importAuth();
		expect(auth.ensureAnonymousSession().csrfToken).not.toBe("x".repeat(32));
		expect(mocks.setCookie).toHaveBeenCalledTimes(2);
	});

	it("enforces the signed seven-day lifetime without renewing it on reuse", async () => {
		vi.useFakeTimers();
		const csrfToken = await setUpSignedSession();
		const cookie = mocks.getCookie();
		const auth = await importAuth();
		vi.advanceTimersByTime(SESSION_LIFETIME_MS - 1000);
		expect(auth.ensureAnonymousSession().csrfToken).toBe(csrfToken);
		expect(mocks.setCookie).toHaveBeenCalledExactlyOnceWith(
			"__app_csrf",
			csrfToken,
			expect.objectContaining({ maxAge: 1 }),
		);
		mocks.setCookie.mockClear();
		vi.advanceTimersByTime(1000);
		const renewed = auth.ensureAnonymousSession();
		expect(renewed.csrfToken).not.toBe(csrfToken);
		expect(mocks.setCookie).toHaveBeenCalledTimes(2);
		mocks.setCookie.mockClear();
		mocks.getCookie.mockReturnValue(cookie);
		vi.advanceTimersByTime(SESSION_LIFETIME_MS);
		expect(auth.ensureAnonymousSession().csrfToken).not.toBe(csrfToken);
		expect(mocks.setCookie).toHaveBeenCalledTimes(2);
	});

	it("marks both cookies secure in production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		mocks.getCookie.mockReturnValue(undefined);
		const auth = await importAuth();

		await auth.ensureAnonymousSession();
		expect(mocks.setCookie).toHaveBeenCalledWith(
			"__app_session",
			expect.any(String),
			expect.objectContaining({ secure: true, httpOnly: true }),
		);

		expect(mocks.setCookie).toHaveBeenLastCalledWith(
			"__app_csrf",
			expect.any(String),
			expect.objectContaining({ secure: true }),
		);
	});
});

async function setUpSignedSession() {
	mocks.getCookie.mockReturnValue(undefined);
	const auth = await importAuth();
	const result = await auth.ensureAnonymousSession();
	const cookie = sessionCookie();
	mocks.setCookie.mockClear();
	mocks.getCookie.mockReset();
	mocks.getCookie.mockReturnValue(cookie);
	return result.csrfToken;
}

function sessionCookie(): string {
	const cookie = mocks.setCookie.mock.calls.find(
		([name]) => name === "__app_session",
	)?.[1];
	expect(typeof cookie).toBe("string");
	return cookie;
}
