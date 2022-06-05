const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: '.' });

const customJestConfig = {
	setupFiles: ['<rootDir>/tests/jest.shim.js'],
	setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
	moduleDirectories: ['node_modules', '<rootDir>/'],
	testEnvironment: 'jest-environment-jsdom',
	testPathIgnorePatterns: ['./dist'],
	watchPathIgnorePatterns: ['./dist'],
	moduleNameMapper: {
		// NOTE(joel): Handle module aliases. Aliases have to match those defined in
		// `<rootDir>/tsconfig.json`.
		'^@/layouts/(.*)$': '<rootDir>/src/layouts/$1',
		'^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
		'^@/shared/(.*)$': '<rootDir>/src/shared/$1',
		'^@/lib/(.*)$': '<rootDir>/src/lib/$1',
		'^@/locales/(.*)$': '<rootDir>/src/locales/$1',
	},
};

// NOTE(joel): createJestConfig is exported this way to ensure that next/jest
// can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
