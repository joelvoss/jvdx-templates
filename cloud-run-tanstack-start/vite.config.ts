import optimizeLocales from "@react-aria/optimize-locales-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

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
