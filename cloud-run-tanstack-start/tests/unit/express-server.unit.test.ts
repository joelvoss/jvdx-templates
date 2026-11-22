import { createServer, request as httpRequest, type Server } from "node:http";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { validateMutationRequest } from "~/lib/auth";

import { createExpressApp } from "../../express-server.mjs";

vi.mock("vite", () => ({
	createServer: async () => ({
		middlewares: (_req: unknown, _res: unknown, next: () => void) => next(),
		ssrLoadModule: async () => ({
			default: {
				fetch: (request: Request) =>
					Response.json({
						url: request.url,
						violation: validateMutationRequest(request, "csrf-token"),
					}),
			},
		}),
	}),
}));

let server: Server | undefined;

describe("Express srvx proxy boundary", () => {
	beforeEach(() => {
		vi.stubEnv("NODE_ENV", "development");
		vi.stubEnv("K_SERVICE", "");
	});

	afterEach(async () => {
		if (server) {
			const currentServer = server;
			await new Promise<void>((resolve, reject) =>
				currentServer.close((error) => (error ? reject(error) : resolve())),
			);
			server = undefined;
		}
		vi.unstubAllEnvs();
	});

	it.each([
		[
			"",
			"https://app.example",
			"http://app.example/_serverFn",
			"Invalid origin",
		],
		["", "http://app.example", "http://app.example/_serverFn", null],
		[
			"cloud-run-service",
			"https://app.example",
			"https://app.example/_serverFn",
			null,
		],
		[
			"cloud-run-service",
			"https://evil.example",
			"https://app.example/_serverFn",
			"Invalid origin",
		],
		[
			"cloud-run-service",
			"http://app.example",
			"https://app.example/_serverFn",
			"Invalid origin",
		],
	])(
		"uses service %s and rejects/accepts origin %s",
		async (service, origin, url, violation) => {
			vi.stubEnv("K_SERVICE", service);
			const app = await createExpressApp();
			server = createServer(app);
			await new Promise<void>((resolve) =>
				server!.listen(0, "127.0.0.1", resolve),
			);
			const address = server.address();
			if (!address || typeof address === "string")
				throw new Error("Missing server address");
			const response = await new Promise<{ status: number; data: unknown }>(
				(resolve, reject) => {
					const request = httpRequest(
						`http://127.0.0.1:${address.port}/_serverFn`,
						{
							method: "POST",
							headers: {
								host: "app.example",
								origin,
								"x-forwarded-proto": "http, https",
								"x-forwarded-host": "evil.example",
								"x-forwarded-for": "9.9.9.9",
								"x-app-csrf": "csrf-token",
								"sec-fetch-site": "same-origin",
							},
						},
						(response) => {
							let body = "";
							response.setEncoding("utf8");
							response.on("data", (chunk) => {
								body += chunk;
							});
							response.on("error", reject);
							response.on("end", () =>
								resolve({
									status: response.statusCode!,
									data: JSON.parse(body),
								}),
							);
						},
					);
					request.on("error", reject);
					request.end();
				},
			);
			expect(response.status).toBe(200);
			expect(response.data).toEqual({ url, violation });
		},
	);
});
