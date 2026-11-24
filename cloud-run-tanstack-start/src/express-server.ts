import express from "express";
import type {
	NextFunction,
	Request as ExpressRequest,
	Response as ExpressResponse,
} from "express";
import type { NodeHttp1Handler } from "srvx";
import { toNodeHandler } from "srvx/node";
import type { ViteDevServer } from "vite";

////////////////////////////////////////////////////////////////////////////////

type ServerEntry = {
	fetch: (request: Request) => Promise<Response>;
};

export type CreateExpressAppOptions = {
	development?: boolean;
	cloudRun?: boolean;
	viteServer?: ViteDevServer;
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Builds the default HTTP security headers map.
 */
export function createSecurityHeaders(
	development = process.env.NODE_ENV === "development",
) {
	const headers = new Map([
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
	if (!development) {
		headers.set(
			"Strict-Transport-Security",
			"max-age=15552000; includeSubDomains",
		);
	}
	return headers;
}

/**
 * Creates the Express application wired with security headers, Cloud Run
 * proxy normalization, and either Vite dev middleware or production assets.
 */
export async function createExpressApp(options: CreateExpressAppOptions = {}) {
	const development =
		options.development ?? process.env.NODE_ENV === "development";
	const cloudRun = options.cloudRun ?? Boolean(process.env.K_SERVICE);
	const nodeAdapterOptions = { trustProxy: cloudRun };
	const securityHeaders = createSecurityHeaders(development);

	const app = express();
	app.use((_req, res, next) => {
		res.setHeaders(securityHeaders);
		res.removeHeader("X-Powered-By");
		next();
	});

	if (cloudRun) {
		app.use((req, _res, next) => {
			// Cloud Run terminates HTTPS before the container. Preserve Host rather
			// than trusting client-supplied forwarded host/IP headers.
			delete req.headers["x-forwarded-host"];
			delete req.headers["x-forwarded-for"];
			req.headers["x-forwarded-proto"] = "https";
			next();
		});
	}

	if (development) {
		// NOTE(joel): In development, we use Vite's middleware to serve the app and
		// handle SSR.
		const viteDevServer =
			options.viteServer ??
			(await (
				await import("vite")
			).createServer({
				server: { middlewareMode: true },
			}));
		app.use(viteDevServer.middlewares);
		app.use(async (req, res, next) => {
			try {
				const { default: serverEntry } = (await viteDevServer.ssrLoadModule(
					"./src/server.ts",
				)) as { default: ServerEntry };
				const handler = toNodeHandler(
					serverEntry.fetch,
					nodeAdapterOptions,
				) as NodeHttp1Handler;
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
		// @ts-expect-error Built server bundle exists only in dist/ after `vite build`.
		const { default: handler } = (await import("./server/server.js")) as {
			default: ServerEntry;
		};
		const nodeHandler = toNodeHandler(
			handler.fetch,
			nodeAdapterOptions,
		) as NodeHttp1Handler;
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
	app.use(
		(
			error: unknown,
			req: ExpressRequest,
			res: ExpressResponse,
			next: NextFunction,
		) => {
			const code =
				typeof error === "object" && error !== null && "code" in error
					? error.code
					: undefined;
			const message = error instanceof Error ? error.message : String(error);
			const clientAborted =
				code === "ECONNRESET" ||
				code === "ABORT_ERR" ||
				message === "aborted" ||
				(req.destroyed && res.destroyed);

			if (clientAborted) return;
			next(error);
		},
	);

	return app;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Start the HTTP server only when executed as the entrypoint (Node 26+
 * native `import.meta.main`), so tests and fixtures can import
 * `createExpressApp` without binding a port or installing signal handlers.
 */
if (import.meta.main) {
	const port = Number.parseInt(process.env.PORT || "3000");
	const app = await createExpressApp();
	const server = app.listen(port, () => {
		console.log(`Server is running on http://localhost:${port}`);
	});

	let shuttingDown = false;

	/**
	 * Gracefully shuts down the server on termination signals.
	 */
	const shutdown = (signal: NodeJS.Signals) => {
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
	};

	process.on("SIGINT", () => shutdown("SIGINT"));
	process.on("SIGTERM", () => shutdown("SIGTERM"));
}
