const nextJest = require('next/jest.js');

const createJestConfig = nextJest({
	// NOTE(joel): Provide the path to your Next.js app to load next.config.js
	// and .env files in your test environment
	dir: './',
});

const config = {
	setupFiles: ['<rootDir>/tests/jest.shim.js'],
	setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
	moduleDirectories: ['node_modules', '<rootDir>/'],
	testEnvironment: 'jsdom',
	testPathIgnorePatterns: ['./dist', './standalone', './public'],
	watchPathIgnorePatterns: ['./dist', './standalone', './public'],
	moduleNameMapper: {
		// NOTE(joel): Handle module aliases. Aliases have to match those defined in
		// `<rootDir>/tsconfig.json`.
		'^@/(.*)$': '<rootDir>/src/$1',
	},
};

// NOTE(joel): createJestConfig is exported this way to ensure that next/jest
// can load the Next.js config which is async
module.exports = createJestConfig(config);
