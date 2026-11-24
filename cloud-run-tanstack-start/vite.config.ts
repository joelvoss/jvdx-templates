import { copyFile, writeFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { build, defineConfig, type Plugin } from "vite";

import packageJson from "./package.json" with { type: "json" };

////////////////////////////////////////////////////////////////////////////////

/**
 * Vite configuration file.
 */
export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		port: 3000,
	},
	environments: {
		client: {
			build: {
				rollupOptions: {
					output: {
						manualChunks,
					},
				},
			},
		},
	},
	plugins: [
		tailwindcss(),
		tanstackStart({
			srcDirectory: "src",
			serverFns: {
				// NOTE: CSRF is handled by `requestMutationGuard` in `src/start.ts`,
				// which validates the request origin and a session-bound CSRF token
				// (see `src/lib/auth.ts`). Disable the built-in warning accordingly.
				disableCsrfMiddlewareWarning: true,
			},
		}),
		// NOTE: React's vite plugin must come after Tanstack Start's vite plugin.
		react({ compiler: true }),
		// NOTE: Replaces unused locale data imports in React Aria packages with 
		// empty modules. Must run as "pre" so it intercepts before Vite's resolver.
		optimizeLocalesPlugin(["en-US", "de-DE"]),
		productionBundlePlugin(),
	],
});

////////////////////////////////////////////////////////////////////////////////

const REACT_ARIA_PATH_RE =
	/[/\\](@react-stately|@react-aria|@react-spectrum|react-aria-components|react-aria)[/\\]/;
const LOCALE_RE = /[a-z]{2}-[A-Z]{2}/;

/**
 * Replaces locale data imports for unused locales in all React Aria packages
 * with empty modules, reducing bundle size. This is a fixed version of the
 * official `@react-aria/optimize-locales-plugin` which fails to intercept
 * imports that travel through the unscoped `react-aria` re-export package.
 */
function optimizeLocalesPlugin(locales: string[]): Plugin {
	const included = locales.map((l) => new Intl.Locale(l));
	const matches = (a: Intl.Locale, b: Intl.Locale) =>
		a.language === b.language && (!b.region || a.region === b.region);

	return {
		name: "optimize-locales",
		enforce: "pre",
		resolveId(specifier, sourcePath, options) {
			if (!sourcePath || options?.ssr) return;
			if (!REACT_ARIA_PATH_RE.test(sourcePath)) return;
			const match = specifier.match(LOCALE_RE);
			if (!match) return;
			const locale = new Intl.Locale(match[0]);
			if (!included.some((l) => matches(locale, l))) {
				return "\0empty-locale";
			}
		},
		load(id) {
			if (id === "\0empty-locale") return "export default {};";
		},
	};
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Assigns node_modules to named vendor chunks for long-term cache stability.
 * Vendor code changes only when dependencies are updated, so these chunks
 * remain cache-valid across application code deploys.
 */
function manualChunks(id: string): string | undefined {
	if (!id.includes("node_modules")) return;
	if (
		id.includes("/react/") ||
		id.includes("/react-dom/") ||
		id.includes("/scheduler/")
	) {
		return "vendor-react";
	}
	if (
		id.includes("/react-aria-components/") ||
		id.includes("/react-aria/") ||
		id.includes("/@react-aria/") ||
		id.includes("/@react-stately/") ||
		id.includes("/@internationalized/")
	) {
		return "vendor-aria";
	}
}

////////////////////////////////////////////////////////////////////////////////

const EXPRESS_SERVER_EXTERNALS = [
	...builtinModules,
	...builtinModules.map((mod) => `node:${mod}`),
	...Object.keys(packageJson.dependencies),
	...Object.keys(packageJson.devDependencies),
	"./server/server.js",
];

/**
 * Builds the production Express server entry (`src/express-server.ts`) into
 * `dist/express-server.js` and emits production `package.json` and
 * `package-lock.json` after TanStack Start finishes building client and SSR
 * bundles.
 */
function productionBundlePlugin(): Plugin {
	return {
		name: "production-bundle",
		apply: "build",
		buildApp: {
			order: "post",
			async handler(builder) {
				const root = builder.config.root;
				const distDir = path.resolve(root, "dist");

				await build({
					root,
					configFile: false,
					publicDir: false,
					build: {
						target: "node26",
						outDir: distDir,
						emptyOutDir: false,
						minify: false,
						ssr: true,
						lib: {
							entry: "src/express-server.ts",
							formats: ["es"],
							fileName: "express-server",
						},
						rolldownOptions: {
							external: (id) =>
								EXPRESS_SERVER_EXTERNALS.some(
									(mod) => id === mod || id.startsWith(`${mod}/`),
								),
						},
					},
				});

				await Promise.all([
					writeFile(
						path.join(distDir, "package.json"),
						`${JSON.stringify(
							{
								name: packageJson.name,
								version: packageJson.version,
								type: packageJson.type,
								dependencies: packageJson.dependencies,
							},
							null,
							"\t",
						)}\n`,
					),
					copyFile(
						path.join(root, "package-lock.json"),
						path.join(distDir, "package-lock.json"),
					),
				]);
			},
		},
	};
}
