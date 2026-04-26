import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

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
		}),
		// NOTE: React's vite plugin must come after Tanstack Start's vite plugin.
		react(),
		// Use @rolldown/plugin-babel for React Compiler support.
		babel({
			presets: [reactCompilerPreset()],
		}),
		// Replaces unused locale data imports in React Aria packages with empty
		// modules. Must run as "pre" so it intercepts before Vite's resolver.
		optimizeLocalesPlugin(["en-US", "de-DE"]),
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