import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI ? 'dot' : 'list',
	snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
	use: {
		baseURL: 'http://localhost:3000',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: './Taskfile.sh build && ./Taskfile.sh start prod',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
	},
});
