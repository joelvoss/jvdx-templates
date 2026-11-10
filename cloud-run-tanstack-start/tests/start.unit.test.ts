import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	return {
		ensureAnonymousSession: vi.fn(),
		i18nMiddleware: vi.fn(),
		setResponseHeader: vi.fn(),
		validateMutationRequest: vi.fn(),
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
		validateMutationRequest: mocks.validateMutationRequest,
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

type Middleware = (args: {
	next: (options?: { context: { csrfToken: string } }) => Promise<Response>;
	request: Request;
	handlerType: "serverFn" | "router";
	context?: { csrfToken: string };
}) => Promise<Response>;

function asMiddleware(middleware: unknown) {
	return middleware as Middleware;
}

describe("start middleware", () => {
	beforeEach(() => {
		mocks.ensureAnonymousSession.mockReset();
		mocks.i18nMiddleware.mockReset();
		mocks.setResponseHeader.mockReset();
		mocks.validateMutationRequest.mockReset();
		mocks.i18nMiddleware.mockReturnValue({});
		mocks.ensureAnonymousSession.mockReturnValue({ csrfToken: "csrf-token" });
		mocks.validateMutationRequest.mockReturnValue(null);
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
			handlerType: "router",
		});

		expect(response).toBe(redirect);
		expect(next).not.toHaveBeenCalled();
		expect(mocks.ensureAnonymousSession).not.toHaveBeenCalled();
		expect(mocks.validateMutationRequest).not.toHaveBeenCalled();
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
			handlerType: "router",
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
			handlerType: "serverFn",
			next: async (options) =>
				asMiddleware(requestMutationGuard)({
					request,
					handlerType: "serverFn",
					next,
					context: options?.context,
				}),
		});
		expect(response.status).toBe(200);
		expect(mocks.ensureAnonymousSession).toHaveBeenCalledTimes(1);
		expect(mocks.validateMutationRequest).toHaveBeenCalledExactlyOnceWith(
			request,
			"csrf-token",
		);
		expect(next).toHaveBeenCalledTimes(1);
		expect(
			mocks.ensureAnonymousSession.mock.invocationCallOrder[0],
		).toBeLessThan(mocks.validateMutationRequest.mock.invocationCallOrder[0]!);
		expect(
			mocks.validateMutationRequest.mock.invocationCallOrder[0],
		).toBeLessThan(next.mock.invocationCallOrder[0]!);
	});

	describe.each(["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])(
		"serverFn %s requests",
		(method) => {
			it("rejects violations without calling next", async () => {
				mocks.validateMutationRequest.mockReturnValue("Invalid CSRF token");
				const { requestMutationGuard } = await importStart();
				const request = new Request("https://example.com/_serverFn", {
					method,
				});
				const next = vi.fn(async () => new Response("ok"));
				const response = await asMiddleware(requestMutationGuard)({
					request,
					handlerType: "serverFn",
					context: { csrfToken: "csrf-token" },
					next,
				});
				expect(mocks.validateMutationRequest).toHaveBeenCalledExactlyOnceWith(
					request,
					"csrf-token",
				);
				expect(response.status).toBe(403);
				expect(await response.text()).toBe("Invalid CSRF token");
				expect(next).not.toHaveBeenCalled();
				expect(mocks.ensureAnonymousSession).not.toHaveBeenCalled();
			});

			it("validates and calls next for valid requests", async () => {
				const { requestMutationGuard } = await importStart();
				const request = new Request("https://example.com/_serverFn", {
					method,
				});
				const downstreamResponse = new Response("ok");
				const next = vi.fn(async () => downstreamResponse);
				const response = await asMiddleware(requestMutationGuard)({
					request,
					handlerType: "serverFn",
					context: { csrfToken: "csrf-token" },
					next,
				});
				expect(mocks.validateMutationRequest).toHaveBeenCalledExactlyOnceWith(
					request,
					"csrf-token",
				);
				expect(response).toBe(downstreamResponse);
				expect(next).toHaveBeenCalledTimes(1);
				expect(mocks.ensureAnonymousSession).not.toHaveBeenCalled();
			});
		},
	);

	it.each([undefined, "false", "true"])(
		"exempts serverFn GET requests regardless of x-tsr-serverfn %s",
		async (header) => {
			mocks.validateMutationRequest.mockReturnValue("Invalid CSRF token");
			const { requestMutationGuard } = await importStart();
			const downstreamResponse = new Response("ok");
			const next = vi.fn(async () => downstreamResponse);
			const response = await asMiddleware(requestMutationGuard)({
				request: new Request("https://example.com/_serverFn", {
					method: "GET",
					headers: header ? { "x-tsr-serverfn": header } : {},
				}),
				handlerType: "serverFn",
				context: { csrfToken: "csrf-token" },
				next,
			});
			expect(response).toBe(downstreamResponse);
			expect(next).toHaveBeenCalledTimes(1);
			expect(mocks.validateMutationRequest).not.toHaveBeenCalled();
			expect(mocks.ensureAnonymousSession).not.toHaveBeenCalled();
		},
	);

	it.each([undefined, "false", "true"])(
		"exempts router POST requests even with forged x-tsr-serverfn %s",
		async (header) => {
			mocks.validateMutationRequest.mockReturnValue("Invalid CSRF token");
			const { requestMutationGuard } = await importStart();
			const downstreamResponse = new Response("ok");
			const next = vi.fn(async () => downstreamResponse);
			const response = await asMiddleware(requestMutationGuard)({
				request: new Request("https://example.com/_serverFn", {
					method: "POST",
					headers: header ? { "x-tsr-serverfn": header } : {},
				}),
				handlerType: "router",
				context: { csrfToken: "csrf-token" },
				next,
			});
			expect(response).toBe(downstreamResponse);
			expect(next).toHaveBeenCalledTimes(1);
			expect(mocks.validateMutationRequest).not.toHaveBeenCalled();
			expect(mocks.ensureAnonymousSession).not.toHaveBeenCalled();
		},
	);
});
