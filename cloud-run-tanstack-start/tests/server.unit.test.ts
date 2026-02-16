import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	return {
		i18nMiddleware: vi.fn(),
		fetch: vi.fn(),
	};
});

vi.mock("@tanstack/react-start/server-entry", () => {
	return {
		default: {
			fetch: mocks.fetch,
		},
	};
});

vi.mock("~/lib/i18n", () => {
	return {
		i18nMiddleware: mocks.i18nMiddleware,
	};
});

async function importServer() {
	vi.resetModules();
	return await import("~/server");
}

describe("server entry", () => {
	beforeEach(() => {
		mocks.i18nMiddleware.mockReset();
		mocks.fetch.mockReset();
	});

	it("returns redirect response without calling handler", async () => {
		const redirect = new Response(null, {
			status: 301,
			headers: { Location: "https://example.com/" },
		});

		mocks.i18nMiddleware.mockReturnValue({ redirect });
		mocks.fetch.mockResolvedValue(new Response("ok"));

		const server = await importServer();
		const request = new Request("https://example.com/en");
		const response = await server.default.fetch(request);

		expect(response).toBe(redirect);
		expect(mocks.fetch).not.toHaveBeenCalled();
	});

	it("appends Set-Cookie header when middleware sets cookie", async () => {
		const setCookie = "__i18n_locale=de; Path=/; HttpOnly; SameSite=Lax";

		mocks.i18nMiddleware.mockReturnValue({ setCookie });
		mocks.fetch.mockResolvedValue(
			new Response("ok", { headers: new Headers() }),
		);

		const server = await importServer();
		const request = new Request("https://example.com/de/books");
		const response = await server.default.fetch(request);

		expect(mocks.fetch).toHaveBeenCalledTimes(1);
		expect(response.headers.get("set-cookie")).toContain(setCookie);
	});
});
