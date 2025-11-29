/// <reference types="vitest/config" />

import { defineConfig } from 'vite';

export default defineConfig({
	test: {
		alias: {
			'~/': new URL('./src/', import.meta.url).pathname,
		},
		silent: 'passed-only'
	},
});
