/// <reference types="vitest/config" />

import { dirname, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import packageJson from './package.json';
import { dtsBundle } from './plugins/vite-plugin-dts-bundle';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [dtsBundle()],
	build: {
		// NOTE(joel): Don't minify, because every consumer will minify themselves
		// anyway. We're only bundling for the sake of publishing to npm.
		minify: false,
		lib: {
			entry: resolve(__dirname, packageJson.source),
			formats: ['cjs', 'es'],
			fileName: parse(packageJson.module).name,
		},
	},
	test: {},
});
