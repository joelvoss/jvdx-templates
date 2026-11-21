import { spawn, type ChildProcess } from "node:child_process";

import { request, type APIRequestContext } from "playwright";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "vitest";

type ExecutionState = {
	readCalls: number;
	mutationCalls: number;
	values: string[];
};
type ServerInfo = {
	type: "ready";
	baseURL: string;
	readURL: string;
	mutationURL: string;
};

const TIMEOUT_MS = 30000;
const contexts: APIRequestContext[] = [];
let server: ChildProcess;
let info: ServerInfo;
let logs = "";
let messageId = 0;

async function executionState(action: "reset" | "snapshot" = "snapshot") {
	const id = ++messageId;
	return new Promise<ExecutionState>((resolve, reject) => {
		const timeout = setTimeout(() => {
			server.off("message", onMessage);
			reject(new Error(`Timed out reading fixture execution state\n${logs}`));
		}, 5000);
		function onMessage(message: { id?: number; state: ExecutionState }) {
			if (message.id !== id) return;
			clearTimeout(timeout);
			server.off("message", onMessage);
			resolve(message.state);
		}
		server.on("message", onMessage);
		server.send({ id, action });
	});
}

async function apiContext(
	storageState?: Awaited<ReturnType<APIRequestContext["storageState"]>>,
) {
	const api = await request.newContext({
		baseURL: info.baseURL,
		storageState,
		maxRedirects: 0,
		timeout: 10000,
	});
	contexts.push(api);
	return api;
}

async function session() {
	const api = await apiContext();
	const response = await api.get("/");
	expect(response.status()).toBe(200);
	const state = await api.storageState();
	const csrfToken = state.cookies.find(
		(cookie) => cookie.name === "__app_csrf",
	)?.value;
	expect(csrfToken).toBeTruthy();
	return { api, state, csrfToken: csrfToken! };
}

describe("generated server-function HTTP auth", () => {
	beforeAll(async () => {
		server = spawn("node", ["./tests/fixtures/auth-http-server.mjs"], {
			cwd: process.cwd(),
			env: {
				...process.env,
				NODE_ENV: "development",
				SESSION_SECRET: "http-test-session-secret-at-least-32-characters",
				K_SERVICE: "",
			},
			stdio: ["ignore", "pipe", "pipe", "ipc"],
		});
		server.stdout?.on("data", (chunk) => {
			logs += String(chunk);
		});
		server.stderr?.on("data", (chunk) => {
			logs += String(chunk);
		});
		info = await new Promise<ServerInfo>((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error(`Auth HTTP server did not start\n${logs}`));
			}, TIMEOUT_MS - 1000);
			server.once("error", (error) => {
				clearTimeout(timeout);
				reject(error);
			});
			server.once("exit", (code) => {
				clearTimeout(timeout);
				reject(new Error(`Auth HTTP server exited (${code})\n${logs}`));
			});
			server.once("message", (message: ServerInfo) => {
				clearTimeout(timeout);
				resolve(message);
			});
		});
		expect(info.type).toBe("ready");
		expect(info.readURL).not.toBe(info.mutationURL);
		expect(new URL(info.mutationURL, info.baseURL).pathname).not.toBe(
			"/_serverFn",
		);
	}, TIMEOUT_MS);

	afterAll(async () => {
		if (!server || server.exitCode !== null || server.signalCode !== null)
			return;
		await new Promise<void>((resolve) => {
			const timeout = setTimeout(() => server.kill("SIGKILL"), 6000);
			server.once("exit", () => {
				clearTimeout(timeout);
				resolve();
			});
			server.kill("SIGTERM");
		});
	}, 10000);

	beforeEach(async () => {
		await executionState("reset");
	});
	afterEach(async () => {
		await Promise.all(contexts.splice(0).map((api) => api.dispose()));
	});

	it("rejects a real mutation without the transport header or CSRF token", async () => {
		const { api } = await session();
		const before = await executionState();
		const response = await api.post(info.mutationURL, {
			headers: { origin: info.baseURL, "sec-fetch-site": "same-origin" },
			form: { value: "must-not-execute" },
		});
		const after = await executionState();
		expect(after).toEqual(before);
		expect(response.status()).toBe(403);
		expect(await response.text()).toBe("Missing CSRF token");
	});

	it.each([undefined, "false", "true"])(
		"executes a valid mutation exactly once with transport header %s",
		async (header) => {
			const { api, csrfToken } = await session();
			const response = await api.post(info.mutationURL, {
				headers: {
					origin: info.baseURL,
					"sec-fetch-site": "same-origin",
					"x-app-csrf": csrfToken,
					...(header === undefined ? {} : { "x-tsr-serverfn": header }),
				},
				form: { value: "executed" },
			});
			expect(response.status()).toBe(200);
			expect(await response.json()).toEqual({
				readCalls: 0,
				mutationCalls: 1,
				values: ["executed"],
			});
			expect(await executionState()).toEqual({
				readCalls: 0,
				mutationCalls: 1,
				values: ["executed"],
			});
		},
	);

	it.each(["false", "true"])(
		"does not bypass CSRF with transport header %s",
		async (header) => {
			const { api } = await session();
			const before = await executionState();
			const response = await api.post(info.mutationURL, {
				headers: { origin: info.baseURL, "x-tsr-serverfn": header },
				form: { value: "must-not-execute" },
			});
			expect(await executionState()).toEqual(before);
			expect(response.status()).toBe(403);
			expect(await response.text()).toBe("Missing CSRF token");
		},
	);

	it.each([
		{
			name: "wrong token",
			headers: { "x-app-csrf": "wrong-token" },
			violation: "Invalid CSRF token",
		},
		{
			name: "missing origin",
			headers: { origin: null },
			violation: "Invalid origin",
		},
		{
			name: "foreign origin",
			headers: { origin: "https://evil.example" },
			violation: "Invalid origin",
		},
		{
			name: "cross-site",
			headers: { "sec-fetch-site": "cross-site" },
			violation: "Invalid origin",
		},
		{
			name: "same-site",
			headers: { "sec-fetch-site": "same-site" },
			violation: "Invalid origin",
		},
	])(
		"rejects $name before generated handler execution",
		async ({ headers: overrides, violation }) => {
			const { api, csrfToken } = await session();
			const before = await executionState();
			const headers = new Headers({
				origin: info.baseURL,
				"sec-fetch-site": "same-origin",
				"x-app-csrf": csrfToken,
			});
			for (const [name, value] of Object.entries(overrides)) {
				if (value == null) headers.delete(name);
				else headers.set(name, value);
			}
			const response = await api.post(info.mutationURL, {
				headers: Object.fromEntries(headers),
				form: { value: "must-not-execute" },
			});
			expect(await executionState()).toEqual(before);
			expect(response.status()).toBe(403);
			expect(await response.text()).toBe(violation);
		},
	);

	it.each(["fresh", "tampered"])(
		"rejects a replayed token with a %s session",
		async (scenario) => {
			const { state, csrfToken } = await session();
			const api = await apiContext(
				scenario === "fresh"
					? undefined
					: {
							...state,
							cookies: state.cookies.map((cookie) =>
								cookie.name === "__app_session"
									? { ...cookie, value: `${cookie.value}tampered` }
									: cookie,
							),
						},
			);
			const before = await executionState();
			const response = await api.post(info.mutationURL, {
				headers: { origin: info.baseURL, "x-app-csrf": csrfToken },
				form: { value: "must-not-execute" },
			});
			expect(await executionState()).toEqual(before);
			expect(response.status()).toBe(403);
			expect(await response.text()).toBe("Invalid CSRF token");
			const cookies = response
				.headersArray()
				.filter((header) => header.name.toLowerCase() === "set-cookie");
			expect(
				cookies.filter((cookie) => cookie.value.startsWith("__app_session=")),
			).toHaveLength(1);
			expect(
				cookies.filter((cookie) => cookie.value.startsWith("__app_csrf=")),
			).toHaveLength(1);
		},
	);

	it.each([undefined, "true"])(
		"executes public reads without security headers (transport %s)",
		async (header) => {
			const api = await apiContext();
			const response = await api.get(info.readURL, {
				headers: header === undefined ? {} : { "x-tsr-serverfn": header },
			});
			expect(response.status()).toBe(200);
			expect(await response.json()).toEqual({
				readCalls: 1,
				mutationCalls: 0,
				values: [],
			});
			expect(await executionState()).toEqual({
				readCalls: 1,
				mutationCalls: 0,
				values: [],
			});
		},
	);

	it.each(["GET", "PUT"])(
		"does not execute a POST handler over %s",
		async (method) => {
			const { api, csrfToken } = await session();
			const before = await executionState();
			const response = await api.fetch(info.mutationURL, {
				method,
				headers: { origin: info.baseURL, "x-app-csrf": csrfToken },
			});
			expect(response.status()).toBe(405);
			expect(response.headers().allow).toBe("POST");
			expect(await executionState()).toEqual(before);
		},
	);
});
