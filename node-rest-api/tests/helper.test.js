import { cacheControl } from '../src/helper/cache-control';

describe('cacheControl', () => {
	let mockRes = {},
		mockNext;

	beforeEach(() => {
		mockRes.set = jest.fn();
		mockNext = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it(`should generate a private Cache-Control header in non-production environments`, () => {
		cacheControl()(null, mockRes, mockNext);
		expect(mockNext).toBeCalledTimes(1);
		expect(mockRes.set).toBeCalledWith(
			'Cache-Control',
			'private, no-cache, no-store, max-age=0, must-revalidate',
		);
	});

	it(`should generate a default Cache-Control header, if no options are passed`, () => {
		// Enable production environment
		const env = { ...process.env };
		process.env = Object.assign(process.env, {
			NODE_ENV: 'production',
		});

		cacheControl()(null, mockRes, mockNext);
		expect(mockNext).toBeCalledTimes(1);
		expect(mockRes.set).toBeCalledWith(
			'Cache-Control',
			'public, max-age=300, s-maxage=600, stale-while-revalidate',
		);

		process.env = { ...env };
	});

	it(`should generate a custom Cache-Control header`, () => {
		// Enable production environment
		const env = { ...process.env };
		process.env = Object.assign(process.env, {
			NODE_ENV: 'production',
		});

		cacheControl({ maxAge: 10, sMaxAge: 20 })(null, mockRes, mockNext);
		expect(mockNext).toBeCalledTimes(1);
		expect(mockRes.set).toBeCalledWith(
			'Cache-Control',
			'public, max-age=10, s-maxage=20, stale-while-revalidate',
		);

		process.env = { ...env };
	});

	it(`should generate a disabled Cache-Control header when set to "false"`, () => {
		// Enable production environment
		const env = { ...process.env };
		process.env = Object.assign(process.env, {
			NODE_ENV: 'production',
		});

		cacheControl(false)(null, mockRes, mockNext);
		expect(mockNext).toBeCalledTimes(1);
		expect(mockRes.set).toBeCalledWith(
			'Cache-Control',
			'no-cache, no-store, must-revalidate',
		);

		process.env = { ...env };
	});
});
