import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	return {
		ensureAnonymousSession: vi.fn(),
		i18nMiddleware: vi.fn(),
		setResponseHeader: vi.fn(),
		validateMutationRequestForServerFn: vi.fn(),
	};
});

vi.mock("@tanstack/react-start", () => {
	return {
		createMiddleware: () => {
			const builder = {
				middleware: (_dependencies: unknown[]) => builder,
				server: (middleware: unknown) => middleware,
			};
			return builder;
		},
		createStart: (factory: () => unknown) => ({ getOptions: factory }),
	};
});

vi.mock("@tanstack/react-start/server", () => {
	return {
		setResponseHeader: mocks.setResponseHeader,
	};
});

vi.mock("~/lib/auth", () => {
	return {
		ensureAnonymousSession: mocks.ensureAnonymousSession,
		validateMutationRequestForServerFn:
			mocks.validateMutationRequestForServerFn,
	};
});

vi.mock("~/lib/i18n", () => {
	return {
		i18nMiddleware: mocks.i18nMiddleware,
	};
});

async function importStart() {
	vi.resetModules();
	return await import("~/start");
}

function asMiddleware(
	middleware: unknown,
): (args: {
	next: (options?: { context: { csrfToken: string } }) => Promise<Response>;
	request: Request;
	context?: { csrfToken: string };
}) => Promise<Response> {
	return middleware as (args: {
		next: (options?: { context: { csrfToken: string } }) => Promise<Response>;
		request: Request;
		context?: { csrfToken: string };
	}) => Promise<Response>;
}

describe("start middleware", () => {
	beforeEach(() => {
		mocks.ensureAnonymousSession.mockReset();
		mocks.i18nMiddleware.mockReset();
		mocks.setResponseHeader.mockReset();
		mocks.validateMutationRequestForServerFn.mockReset();
		mocks.i18nMiddleware.mockReturnValue({});
		mocks.ensureAnonymousSession.mockReturnValue({ csrfToken: "csrf-token" });
		mocks.validateMutationRequestForServerFn.mockReturnValue(null);
	});

	it("runs i18n before session and mutation middleware", async () => {
		const {
			requestI18nMiddleware,
			requestMutationGuard,
			requestSessionMiddleware,
			startInstance,
		} = await importStart();

		expect((await startInstance.getOptions()).requestMiddleware).toEqual([
			requestI18nMiddleware,
			requestSessionMiddleware,
			requestMutationGuard,
		]);
	});

	it("returns i18n redirects without calling later middleware", async () => {
		const redirect = new Response(null, {
			status: 301,
			headers: { Location: "https://example.com/books" },
		});
		mocks.i18nMiddleware.mockReturnValue({ redirect });

		const { requestI18nMiddleware } = await importStart();
		const next = vi.fn(async () => new Response("ok"));

		const response = await asMiddleware(requestI18nMiddleware)({
			next,
			request: new Request("https://example.com/en/books"),
		});

		expect(response).toBe(redirect);
		expect(next).not.toHaveBeenCalled();
		expect(mocks.ensureAnonymousSession).not.toHaveBeenCalled();
		expect(mocks.validateMutationRequestForServerFn).not.toHaveBeenCalled();
	});

	it("appends the locale cookie to the downstream response", async () => {
		const setCookie = "__app_locale=de; Path=/; HttpOnly; SameSite=Lax";
		mocks.i18nMiddleware.mockReturnValue({ setCookie });

		const { requestI18nMiddleware } = await importStart();
		const downstreamResponse = new Response("ok", { headers: new Headers() });
		const next = vi.fn(async () => downstreamResponse);

		const response = await asMiddleware(requestI18nMiddleware)({
			next,
			request: new Request("https://example.com/de/books"),
		});

		expect(response).toBe(downstreamResponse);
		expect(mocks.setResponseHeader).toHaveBeenCalledWith(
			"set-cookie",
			setCookie,
		);
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("initializes one session and passes its token to the mutation guard", async () => {
		const { requestSessionMiddleware, requestMutationGuard } =
			await importStart();
		const request = new Request("https://example.com/_serverFn", {
			method: "POST",
		});
		const next = vi.fn(async () => new Response("ok"));
		const response = await asMiddleware(requestSessionMiddleware)({
			request,
			next: async (options) =>
				asMiddleware(requestMutationGuard)({
					request,
					next,
					context: options?.context,
				}),
		});
		expect(response.status).toBe(200);
		expect(mocks.ensureAnonymousSession).toHaveBeenCalledTimes(1);
		expect(
			mocks.validateMutationRequestForServerFn,
		).toHaveBeenCalledExactlyOnceWith(request, "csrf-token");
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("rejects a mutation violation without running downstream handlers", async () => {
		mocks.validateMutationRequestForServerFn.mockReturnValue(
			"Invalid CSRF token",
		);
		const { requestMutationGuard } = await importStart();
		const next = vi.fn(async () => new Response("ok"));
		const response = await asMiddleware(requestMutationGuard)({
			request: new Request("https://example.com/_serverFn", { method: "POST" }),
			context: { csrfToken: "csrf-token" },
			next,
		});
		expect(response.status).toBe(403);
		expect(await response.text()).toBe("Invalid CSRF token");
		expect(next).not.toHaveBeenCalled();
		expect(mocks.ensureAnonymousSession).not.toHaveBeenCalled();
	});
});
