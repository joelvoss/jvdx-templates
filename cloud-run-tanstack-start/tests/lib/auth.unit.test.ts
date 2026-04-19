import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	return {
		getRequest: vi.fn(),
		setCookie: vi.fn(),
		useSession: vi.fn(),
	};
});

vi.mock("@tanstack/react-start/server", () => {
	return {
		getRequest: mocks.getRequest,
		setCookie: mocks.setCookie,
		useSession: mocks.useSession,
	};
});

async function importAuth() {
	vi.resetModules();
	return await import("~/lib/auth");
}

////////////////////////////////////////////////////////////////////////////////

describe("lib/auth", () => {
	afterEach(() => {
		delete process.env.NODE_ENV;
		mocks.getRequest.mockReset();
		mocks.setCookie.mockReset();
		mocks.useSession.mockReset();
	});

	it("bootstraps a csrf token into the signed session when missing", async () => {
		const update = vi.fn(async () => undefined);
		mocks.useSession.mockResolvedValue({
			data: {},
			update,
		});
		const auth = await importAuth();

		const result = await auth.ensureAnonymousSession();

		expect(update).toHaveBeenCalledTimes(1);
		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({ csrfToken: expect.any(String) }),
		);
		expect(result.csrfToken).toBeTruthy();
		expect(mocks.setCookie).toHaveBeenCalledWith(
			"__app_csrf",
			expect.any(String),
			expect.objectContaining({
				httpOnly: false,
				sameSite: "lax",
			}),
		);
	});

	it("reuses the csrf token already stored in the signed session", async () => {
		const update = vi.fn(async () => undefined);
		mocks.useSession.mockResolvedValue({
			data: { csrfToken: "csrf-token" },
			update,
		});
		const auth = await importAuth();

		const result = await auth.ensureAnonymousSession();

		expect(update).not.toHaveBeenCalled();
		expect(result.csrfToken).toBe("csrf-token");
		expect(mocks.setCookie).toHaveBeenCalledWith(
			"__app_csrf",
			"csrf-token",
			expect.any(Object),
		);
	});

	it("allows public server function reads without mutation checks", async () => {
		mocks.useSession.mockResolvedValue({
			data: { csrfToken: "csrf-token" },
			update: vi.fn(async () => undefined),
		});
		const auth = await importAuth();

		const result = await auth.validateMutationRequestForServerFn(
			new Request("https://example.com/_serverFn", {
				method: "GET",
				headers: { "x-tsr-serverFn": "true" },
			}),
		);

		expect(result).toBeNull();
	});

	it("rejects mutation server function requests with invalid origin", async () => {
		mocks.useSession.mockResolvedValue({
			data: { csrfToken: "csrf-token" },
			update: vi.fn(async () => undefined),
		});
		const auth = await importAuth();

		const result = await auth.validateMutationRequestForServerFn(
			new Request("https://example.com/_serverFn", {
				method: "POST",
				headers: {
					"x-tsr-serverFn": "true",
					origin: "https://evil.example",
					"sec-fetch-site": "cross-site",
					"x-app-csrf": "csrf-token",
				},
			}),
		);

		expect(result).toBe("Invalid origin");
	});

	it("accepts mutation requests only when csrf header matches signed session state", async () => {
		mocks.useSession.mockResolvedValue({
			data: { csrfToken: "csrf-token" },
			update: vi.fn(async () => undefined),
		});
		const auth = await importAuth();

		const result = await auth.validateMutationRequestForServerFn(
			new Request("https://example.com/_serverFn", {
				method: "POST",
				headers: {
					"x-tsr-serverFn": "true",
					origin: "https://example.com",
					"sec-fetch-site": "same-origin",
					"x-app-csrf": "csrf-token",
				},
			}),
		);

		expect(result).toBeNull();
	});

	it("marks the readable csrf cookie secure in production", async () => {
		process.env.NODE_ENV = "production";
		mocks.useSession.mockResolvedValue({
			data: { csrfToken: "csrf-token" },
			update: vi.fn(async () => undefined),
		});
		const auth = await importAuth();

		await auth.ensureAnonymousSession();

		expect(mocks.setCookie).toHaveBeenCalledWith(
			"__app_csrf",
			"csrf-token",
			expect.objectContaining({ secure: true }),
		);
	});
});
