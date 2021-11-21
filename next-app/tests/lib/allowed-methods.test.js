import { allowedMethods } from '@/lib/allowed-methods';

describe('allowedMethods', () => {
	describe('throws', () => {
		test('on missing options', () => {
			expect.assertions(2);

			try {
				allowedMethods();
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe('"options.methods" required.');
			}
		});

		test('on wrong options', () => {
			expect.assertions(2);

			try {
				allowedMethods({ methods: 'GET' });
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe(
					'"options.methods" must be an array if method strings.',
				);
			}
		});
	});

	describe('base', () => {
		test('returns a middleware function', () => {
			const middleware = allowedMethods({ methods: ['GET'] });
			expect(typeof middleware).toBe(typeof Function);
		});

		test('allows configured method', () => {
			const middleware = allowedMethods({ methods: ['GET'] });

			// NOTE(joel): Request & Response mocks.
			const req = { method: 'get' };
			const setHeader = jest.fn();
			const json = jest.fn();
			const status = jest.fn(() => ({ json }));
			const res = { setHeader, status };
			const done = jest.fn();

			middleware(req, res, done);

			expect(done).toBeCalledTimes(1);
			expect(setHeader).not.toBeCalled();
			expect(json).not.toBeCalled();
			expect(status).not.toBeCalled();
		});

		test('permits configured method', () => {
			const middleware = allowedMethods({ methods: ['GET'] });

			// NOTE(joel): Request & Response mocks.
			const req = { method: 'post' };
			const setHeader = jest.fn();
			const json = jest.fn();
			const status = jest.fn(() => ({ json }));
			const res = { setHeader, status };
			const done = jest.fn();

			middleware(req, res, done);

			expect(done).not.toBeCalled();
			expect(setHeader).toBeCalledWith('Allow', ['GET']);
			expect(json).toBeCalledWith({
				code: 'METHOD_NOT_ALLOWED',
				error: 'Method "POST" not allowed',
			});
			expect(status).toBeCalledWith(405);
		});
	});
});
