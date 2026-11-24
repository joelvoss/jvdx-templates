// NOTE: Spawned directly by `node` in `site.integration.test.ts`; written as
// `.mjs` so Node runs it as an ES module without a build step.
import path from "node:path";

import { createServer } from "vite";

import { createExpressApp } from "../../src/express-server.ts";

const REAL_FIRESTORE_PATH = path.resolve("./src/lib/firestore.ts");
const FAKE_FIRESTORE_PATH = path.resolve(
	"./tests/fixtures/in-memory-firestore.ts",
);

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

const vite = await createServer({
	server: { middlewareMode: true, hmr: false },
	plugins: [fakeFirestorePlugin],
});

const firestoreFixture = await vite.ssrLoadModule(
	"./tests/fixtures/in-memory-firestore.ts",
);

const app = await createExpressApp({ development: true, viteServer: vite });

const server = app.listen(0, "127.0.0.1", () => {
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
