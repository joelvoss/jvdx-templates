import { spawn, type ChildProcess } from "node:child_process";

import { chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

////////////////////////////////////////////////////////////////////////////////

const BASE_URL = "http://127.0.0.1:3100";
const SERVER_START_TIMEOUT_MS = 15000;

let serverProcess: ChildProcess | undefined;
let serverLogs = "";

////////////////////////////////////////////////////////////////////////////////

describe("auth browser smoke", () => {
	beforeAll(async () => {
		serverProcess = spawn("node", ["./express-server.mjs"], {
			cwd: process.cwd(),
			env: {
				...process.env,
				NODE_ENV: "development",
				PORT: "3100",
				K_SERVICE: "",
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
		if (
			!serverProcess ||
			serverProcess.exitCode !== null ||
			serverProcess.signalCode !== null
		) {
			return;
		}

		const exited = new Promise<void>((resolve) => {
			serverProcess?.once("exit", () => resolve());
		});

		serverProcess.kill("SIGTERM");
		await exited;
	});

	it(
		"bootstraps session cookies and renders a not-found page without browser errors",
		async () => {
			const browser = await chromium.launch();
			try {
				const browserContext = await browser.newContext();
				try {
					const page = await browserContext.newPage();
					const pageErrors: string[] = [];
					page.on("pageerror", (error) => pageErrors.push(error.message));

					const firstResponse = await page.goto(BASE_URL, {
						waitUntil: "networkidle",
					});

					expect(firstResponse).not.toBeNull();
					expect(firstResponse?.status()).toBe(200);

					const cookies = await browserContext.cookies();
					const sessionCookie = cookies.find(
						(cookie) => cookie.name === "__app_session",
					);
					const csrfCookie = cookies.find(
						(cookie) => cookie.name === "__app_csrf",
					);

					expect(sessionCookie).toBeDefined();
					expect(sessionCookie?.httpOnly).toBe(true);
					expect(csrfCookie).toBeDefined();
					expect(csrfCookie?.value).toBeTruthy();

					const notFoundResponse = await page.goto(
						`${BASE_URL}/does-not-exist`,
						{
							waitUntil: "networkidle",
						},
					);
					expect(notFoundResponse?.status()).toBe(404);
					expect(pageErrors).toEqual([]);
				} finally {
					await browserContext.close();
				}
			} finally {
				await browser.close();
			}
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
