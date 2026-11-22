import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	return {
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

async function importServer() {
	vi.resetModules();
	return await import("~/server");
}

describe("server entry", () => {
	beforeEach(() => {
		mocks.fetch.mockReset();
	});

	it("delegates requests to the tanstack start handler", async () => {
		const expected = new Response("ok");
		mocks.fetch.mockResolvedValue(expected);

		const server = await importServer();
		const request = new Request("https://example.com/books");
		const response = await server.default.fetch(request);

		expect(mocks.fetch).toHaveBeenCalledTimes(1);
		expect(mocks.fetch).toHaveBeenCalledWith(request);
		expect(response).toBe(expected);
	});
});
