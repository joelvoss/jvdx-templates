import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	test: {
		pool: 'threads',
		projects: [
			{
				extends: true,
				test: {
					include: ['tests/**/*.unit.{test,spec}.{tsx,ts}'],
					name: 'unit-jsdom',
					environment: 'jsdom',
				},
			},
			{
				extends: true,
				test: {
					include: ['tests/**/*.browser.{test,spec}.{tsx,ts}'],
					name: 'unit-browser',
					browser: {
						enabled: true,
						headless: true,
						screenshotFailures: false,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }],
					},
				},
			},
		],
	},
});
