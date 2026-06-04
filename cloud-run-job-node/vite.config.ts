/// <reference types="vitest/config" />

import { dirname, parse, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import packageJson from "./package.json";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"~/": `${resolve(__dirname, "src")}/`,
		},
	},
	build: {
		minify: false,
		lib: {
			entry: resolve(__dirname, packageJson.source),
			formats: ["es"],
			fileName: parse(packageJson.module).name,
		},
		ssr: true,
	},
	test: {},
});
