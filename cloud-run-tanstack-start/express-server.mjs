import express from "express";
import { toNodeHandler } from "srvx/node";

////////////////////////////////////////////////////////////////////////////////

const DEVELOPMENT = process.env.NODE_ENV === "development";
const PORT = Number.parseInt(process.env.PORT || "3000");

////////////////////////////////////////////////////////////////////////////////

const app = express();
app.use((_req, res, next) => {
	const headers = new Map([
		["Cross-Origin-Resource-Policy", "same-origin"],
		["Cross-Origin-Opener-Policy", "same-origin"],
		["Origin-Agent-Cluster", "?1"],
		["Referrer-Policy", "no-referrer"],
		["Strict-Transport-Security", "max-age=15552000; includeSubDomains"],
		["X-Content-Type-Options", "nosniff"],
		["X-DNS-Prefetch-Control", "off"],
		["X-Download-Options", "noopen"],
		["X-Frame-Options", "SAMEORIGIN"],
		["X-Permitted-Cross-Domain-Policies", "none"],
		["X-XSS-Protection", "0"],
	]);
	res.setHeaders(headers);
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
	app.use(express.static("client"));
	app.use(async (req, res, next) => {
		try {
			await nodeHandler(req, res);
		} catch (error) {
			next(error);
		}
	});
}

const server = app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

////////////////////////////////////////////////////////////////////////////////

/**
 * Gracefully shuts down the server on termination signals.
 */
function shutdown(signal) {
	console.log(`\nReceived ${signal}. Shutting down...`);
	server.close((error) => {
		if (error) {
			console.error("Error during shutdown:", error);
			process.exit(1);
		}
		process.exit(0);
	});
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
