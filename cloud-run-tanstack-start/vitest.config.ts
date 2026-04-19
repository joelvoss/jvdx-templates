import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration file.
 * We use a separate Vitest config file instead of putting the config in vite.
 * config.ts to avoid loading unnecessary plugins during testing, which can
 * slow down the test runs.
 */
export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
		tailwindcss(),
		react(),
		babel({
			presets: [reactCompilerPreset()],
		}),
	],
	optimizeDeps: {
		include: ["@tanstack/react-router", "react-aria-components"],
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
