import express from "express";
import { toNodeHandler } from "srvx/node";

////////////////////////////////////////////////////////////////////////////////

const DEVELOPMENT = process.env.NODE_ENV === "development";
const PORT = Number.parseInt(process.env.PORT || "3000");
const SECURITY_HEADERS = new Map([
	["Cross-Origin-Resource-Policy", "same-origin"],
	["Cross-Origin-Opener-Policy", "same-origin"],
	["Origin-Agent-Cluster", "?1"],
	["Referrer-Policy", "no-referrer"],
	["X-Content-Type-Options", "nosniff"],
	["X-DNS-Prefetch-Control", "off"],
	["X-Download-Options", "noopen"],
	["X-Frame-Options", "SAMEORIGIN"],
	["X-Permitted-Cross-Domain-Policies", "none"],
	["X-XSS-Protection", "0"],
]);
if (!DEVELOPMENT) {
	SECURITY_HEADERS.set(
		"Strict-Transport-Security",
		"max-age=15552000; includeSubDomains",
	);
}

////////////////////////////////////////////////////////////////////////////////

const app = express();
app.use((_req, res, next) => {
	res.setHeaders(SECURITY_HEADERS);
	res.removeHeader("X-Powered-By");
	next();
});

if (DEVELOPMENT) {
	// NOTE(joel): In development, we use Vite's middleware to serve the app and
	// handle SSR.
	const viteDevServer = await import("vite").then((vite) =>
		vite.createServer({
			server: { middlewareMode: true },
		}),
	);
	app.use(viteDevServer.middlewares);
	app.use(async (req, res, next) => {
		try {
			const { default: serverEntry } =
				await viteDevServer.ssrLoadModule("./src/server.ts");
			const handler = toNodeHandler(serverEntry.fetch);
			await handler(req, res);
		} catch (error) {
			if (typeof error === "object" && error instanceof Error) {
				viteDevServer.ssrFixStacktrace(error);
			}
			next(error);
		}
	});
} else {
	// NOTE(joel): In production, we can directly import the server entry since
	// it's already built.
	const { default: handler } = await import("./server/server.js");
	const nodeHandler = toNodeHandler(handler.fetch);
	app.use(
		express.static("client", {
			maxAge: "1y",
			immutable: true,
		}),
	);
	app.use(async (req, res, next) => {
		try {
			await nodeHandler(req, res);
		} catch (error) {
			next(error);
		}
	});
}

// NOTE(joel): Browser navigations, HMR reloads, and closed connections can
// abort an SSR stream after rendering has started. Treat those disconnects as
// normal request lifecycle events, but leave unrelated errors for Express to
// report.
app.use((error, req, res, next) => {
	const code = error?.code;
	const message = error instanceof Error ? error.message : String(error);
	const clientAborted =
		code === "ECONNRESET" ||
		code === "ABORT_ERR" ||
		message === "aborted" ||
		(req.destroyed && res.destroyed);

	if (clientAborted) return;
	next(error);
});

const server = app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

let shuttingDown = false;

////////////////////////////////////////////////////////////////////////////////

/**
 * Gracefully shuts down the server on termination signals.
 */
function shutdown(signal) {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log(`\nReceived ${signal}. Shutting down...`);
	const timeout = setTimeout(() => process.exit(1), 10_000);
	timeout.unref();
	server.close((error) => {
		clearTimeout(timeout);
		if (error) {
			console.error("Error during shutdown:", error);
			process.exit(1);
		}
		process.exit(0);
	});
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
