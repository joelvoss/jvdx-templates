module.exports = {
	preset: '@jvdx/jest-preset',
	moduleNameMapper: {
		// NOTE(joel): Handle CSS imports (with CSS modules).
		'^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
		// NOTE(joel): Handle CSS imports (w/o CSS modules).
		'^.+\\.(css|sass|scss)$': '<rootDir>/tests/__mocks__/style-mock.js',

		// NOTE(joel): Handle module aliases. Aliases have to match those defined in
		// `/jsconfig.json`.
		'^@/layouts/(.*)$': '<rootDir>/src/layouts/$1',
		'^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
		'^@/shared/(.*)$': '<rootDir>/src/shared/$1',
		'^@/lib/(.*)$': '<rootDir>/src/lib/$1',
	},
	setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
	testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
	transform: {
		// NOTE(joel): Use babel-jest to transpile tests with the next/babel preset.
		// We don't want to use a `babel.config.json` file so Next.js 12 can use
		// the rust based compiler SWC for transpilation.
		// Transform path matcher RegExp have to match those defined in
		// `@jvdx/jest-preset`.
		'^.+\\.jsx?$': ['babel-jest', { presets: ['next/babel'] }],
	},
	transformIgnorePatterns: [
		'/node_modules/',
		'^.+\\.module\\.(css|sass|scss)$',
	],
};
