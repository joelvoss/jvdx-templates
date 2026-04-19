import { spawn, type ChildProcess } from "node:child_process";

import { chromium, request as playwrightRequest } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

////////////////////////////////////////////////////////////////////////////////

const BASE_URL = "http://127.0.0.1:3100";
const SERVER_START_TIMEOUT_MS = 15000;

let serverProcess: ChildProcess | undefined;
let serverLogs = "";

////////////////////////////////////////////////////////////////////////////////

describe("auth playwright", () => {
	beforeAll(async () => {
		serverProcess = spawn("node", ["./express-server.mjs"], {
			cwd: process.cwd(),
			env: {
				...process.env,
				NODE_ENV: "development",
				PORT: "3100",
			},
			stdio: ["ignore", "pipe", "pipe"],
		});

		serverProcess.stdout?.on("data", (chunk) => {
			serverLogs += String(chunk);
		});

		serverProcess.stderr?.on("data", (chunk) => {
			serverLogs += String(chunk);
		});

		await waitForServer(BASE_URL);
	}, SERVER_START_TIMEOUT_MS);

	afterAll(async () => {
		if (!serverProcess) return;

		const exited = new Promise<void>((resolve) => {
			serverProcess?.once("exit", () => resolve());
		});

		serverProcess.kill("SIGTERM");
		await exited;
	});

	it(
		"bootstraps signed session state and rejects direct mutation calls without browser state",
		async () => {
			const browser = await chromium.launch();
			const browserContext = await browser.newContext();
			const page = await browserContext.newPage();

			const firstResponse = await page.goto(BASE_URL, {
				waitUntil: "domcontentloaded",
			});

			expect(firstResponse).not.toBeNull();

			const cookies = await browserContext.cookies();
			const sessionCookie = cookies.find(
				(cookie) => cookie.name === "__app_session",
			);
			const csrfCookie = cookies.find((cookie) => cookie.name === "__app_csrf");

			expect(sessionCookie).toBeDefined();
			expect(sessionCookie?.httpOnly).toBe(true);
			expect(csrfCookie).toBeDefined();
			expect(csrfCookie?.value).toBeTruthy();

			const anonymousApi = await playwrightRequest.newContext();
			const unauthorizedResponse = await anonymousApi.fetch(
				`${BASE_URL}/_serverFn`,
				{
					method: "POST",
					headers: {
						"x-tsr-serverFn": "true",
						"content-type": "application/json",
						origin: BASE_URL,
						"sec-fetch-site": "same-origin",
					},
					data: {},
				},
			);

			expect(unauthorizedResponse.status()).toBe(403);

			const authenticatedApi = await playwrightRequest.newContext({
				storageState: await browserContext.storageState(),
			});
			const authorizedResponse = await authenticatedApi.fetch(
				`${BASE_URL}/_serverFn`,
				{
					method: "POST",
					headers: {
						"x-tsr-serverFn": "true",
						"content-type": "application/json",
						origin: BASE_URL,
						"sec-fetch-site": "same-origin",
						"x-app-csrf": csrfCookie?.value ?? "",
					},
					data: {},
				},
			);

			expect(authorizedResponse.status()).not.toBe(403);

			await anonymousApi.dispose();
			await authenticatedApi.dispose();
			await browserContext.close();
			await browser.close();
		},
		SERVER_START_TIMEOUT_MS,
	);
});

////////////////////////////////////////////////////////////////////////////////

async function waitForServer(baseUrl: string) {
	const deadline = Date.now() + SERVER_START_TIMEOUT_MS;

	while (Date.now() < deadline) {
		try {
			const response = await fetch(baseUrl);
			if (response.ok) return;
		} catch {
			// Server not ready yet.
		}

		await new Promise((resolve) => setTimeout(resolve, 250));
	}

	throw new Error(`Server did not start at ${baseUrl}\n${serverLogs}`);
}
