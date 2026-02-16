import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration file.
 * We use a separate Vitest config file instead of putting the config in vite.
 * config.ts to avoid loading unnecessary plugins during testing, which can 
 * slow down the test runs.
 */
export default defineConfig({
	plugins: [
		tsConfigPaths(),
		tailwindcss(),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
	],
	optimizeDeps: {
		include: ["@tanstack/react-router"],
	},
	test: {
		pool: "threads",
		projects: [
			{
				extends: true,
				test: {
					include: ["tests/**/*.unit.{test,spec}.{tsx,ts}"],
					name: "unit-node",
					environment: "node",
				},
			},
			{
				extends: true,
				test: {
					include: ["tests/**/*.browser.{test,spec}.{tsx,ts}"],
					name: "unit-browser",
					browser: {
						enabled: true,
						headless: true,
						screenshotFailures: false,
						provider: playwright(),
						instances: [{ browser: "chromium" }],
					},
				},
			},
		],
	},
});
