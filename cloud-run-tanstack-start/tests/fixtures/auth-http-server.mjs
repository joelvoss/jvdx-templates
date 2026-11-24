// NTOE: Spawned directly by `node` in `auth-http.integration.test.ts`; written
// as `.mjs` so Node runs it as an ES module without a build step.
import express from "express";
import { toNodeHandler } from "srvx/node";
import { createServer } from "vite";

const vite = await createServer({
	server: { middlewareMode: true, ws: false },
});
const { default: serverEntry } = await vite.ssrLoadModule("./src/server.ts");
const fixtures = await vite.ssrLoadModule(
	"./tests/fixtures/auth-server-functions.ts",
);
const recorder = await vite.ssrLoadModule(
	"./tests/fixtures/auth-execution-state.ts",
);

const app = express();
app.use(toNodeHandler(serverEntry.fetch));
const server = app.listen(0, "127.0.0.1", () => {
	const address = server.address();
	process.send({
		type: "ready",
		baseURL: `http://127.0.0.1:${address.port}`,
		readURL: fixtures.readFixture.url,
		mutationURL: fixtures.mutationFixture.url,
	});
});

process.on("message", ({ id, action }) => {
	if (action === "reset") recorder.reset();
	process.send({ id, state: recorder.snapshot() });
});

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
