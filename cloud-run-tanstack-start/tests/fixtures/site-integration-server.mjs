import { createServer as createHttpServer } from "node:http";
import path from "node:path";

import express from "express";
import { toNodeHandler } from "srvx/node";
import { createServer } from "vite";

const REAL_FIRESTORE_PATH = path.resolve("./src/lib/firestore.ts");
const FAKE_FIRESTORE_PATH = path.resolve(
	"./tests/fixtures/in-memory-firestore.ts",
);

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

const fakeFirestorePlugin = {
	name: "test-in-memory-firestore",
	enforce: "pre",
	resolveId(source) {
		if (
			source === "~/lib/firestore" ||
			source === REAL_FIRESTORE_PATH ||
			source.endsWith("/src/lib/firestore") ||
			source.endsWith("/src/lib/firestore.ts")
		) {
			return FAKE_FIRESTORE_PATH;
		}
	},
};

const app = express();
const server = createHttpServer(app);

const vite = await createServer({
	server: { middlewareMode: true, hmr: { server } },
	plugins: [fakeFirestorePlugin],
});

const firestoreFixture = await vite.ssrLoadModule(
	"./tests/fixtures/in-memory-firestore.ts",
);

app.use((_req, res, next) => {
	res.setHeaders(SECURITY_HEADERS);
	res.removeHeader("X-Powered-By");
	next();
});
app.use(vite.middlewares);
app.use(async (req, res, next) => {
	try {
		const { default: serverEntry } =
			await vite.ssrLoadModule("./src/server.ts");
		const handler = toNodeHandler(serverEntry.fetch);
		await handler(req, res);
	} catch (error) {
		if (error instanceof Error) {
			vite.ssrFixStacktrace(error);
		}
		next(error);
	}
});

server.listen(0, "127.0.0.1", () => {
	const address = server.address();
	process.send({
		type: "ready",
		baseURL: `http://127.0.0.1:${address.port}`,
	});
});

process.on(
	"message",
	({ id, action, books, operation, message, persistent }) => {
		if (action === "reset") {
			firestoreFixture.resetFirestore(books ?? []);
		} else if (action === "failNext") {
			firestoreFixture.failNextFirestoreOperation(
				operation,
				message,
				Boolean(persistent),
			);
		}
		process.send({ id, books: firestoreFixture.snapshotBooks() });
	},
);

let shuttingDown = false;
async function shutdown() {
	if (shuttingDown) return;
	shuttingDown = true;
	const timeout = setTimeout(() => process.exit(1), 5000);
	timeout.unref();
	await new Promise((resolve) => server.close(resolve));
	await vite.close();
	process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("disconnect", shutdown);
