import optimizeLocales from "@react-aria/optimize-locales-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

////////////////////////////////////////////////////////////////////////////////

/**
 * Vite configuration file.
 */
export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [
		tsConfigPaths(),
		tailwindcss(),
		tanstackStart({
			srcDirectory: "src",
		}),
		// NOTE: React's vite plugin must come after Tanstack Start's vite plugin.
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		// React Aria's optimizeLocales plugin must come after react's vite plugin,
		// and must be enforced as "pre" to ensure it runs before all other
		// plugins. This plugin optimizes the locales used in the application,
		// reducing bundle size by including only the specified locales.
		{
			...optimizeLocales.vite({
				locales: ["en-US", "de-DE"],
			}),
			enforce: "pre",
		},
	],
});
