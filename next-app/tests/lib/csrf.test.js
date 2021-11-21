import crypto from 'crypto';
import { csrf } from '@/lib/csrf';

describe('csrf', () => {
	describe('base', () => {
		// NOTE(joel): Mock crypto.randomBytes to always return the same buffer.
		let randomBytesMock;

		beforeEach(() => {
			randomBytesMock = jest
				.spyOn(crypto, 'randomBytes')
				.mockImplementationOnce(() => Buffer.from('test'));
		});

		afterEach(() => {
			randomBytesMock.mockRestore();
		});

		test('extends the req object with a csrf token and sets a new csrf cookie', () => {
			const middleware = csrf({ origin: true });

			const req = { headers: {}, cookies: {} };
			const setHeader = jest.fn();
			const getHeader = () => {};
			const res = { setHeader, getHeader };
			const done = jest.fn();

			middleware(req, res, done);

			expect(req).toEqual({
				cookies: {},
				csrf: {
					token: '74657374',
					verified: false,
				},
				headers: {},
			});

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'XSRF-TOKEN=74657374%7C01df32396e63e90f0f3a1c57bfc9e677b2ef80111b188efced758e15be34e097; Path=/; HttpOnly; SameSite=Lax',
			]);
			expect(done).toBeCalledTimes(1);
		});

		test('validates csrf token in request', () => {
			const middleware = csrf({ origin: true });

			const req = {
				headers: {
					'x-xsrf-token': '74657374',
				},
				cookies: {
					'XSRF-TOKEN':
						'74657374|01df32396e63e90f0f3a1c57bfc9e677b2ef80111b188efced758e15be34e097',
				},
			};
			const setHeader = jest.fn();
			const getHeader = () => {};
			const res = { setHeader, getHeader };
			const done = jest.fn();

			middleware(req, res, done);

			expect(req).toEqual({
				cookies: {
					'XSRF-TOKEN':
						'74657374|01df32396e63e90f0f3a1c57bfc9e677b2ef80111b188efced758e15be34e097',
				},
				csrf: { token: '74657374', verified: true },
				headers: { 'x-xsrf-token': '74657374' },
			});

			expect(setHeader).not.toBeCalled();
			expect(done).toBeCalledTimes(1);
		});

		test('create a secure cookie on https origins', () => {
			const middleware = csrf({ origin: 'https://adesso.de' });

			const req = { headers: { origin: 'https://adesso.de' }, cookies: {} };
			const setHeader = jest.fn();
			const getHeader = () => {};
			const res = { setHeader, getHeader };
			const done = jest.fn();

			middleware(req, res, done);

			expect(req).toEqual({
				cookies: {},
				csrf: {
					token: '74657374',
					verified: false,
				},
				headers: {
					origin: 'https://adesso.de',
				},
			});

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'__Host-XSRF-TOKEN=74657374%7Cc59266560faff9ee01fd99a32cff83a29983d8ea8fdb55777bd409a71f5e8be7; Path=/; HttpOnly; Secure; SameSite=Lax',
			]);
			expect(done).toBeCalledTimes(1);
		});

		test('"prefix" option', () => {
			const middleware = csrf({ origin: true, prefix: 'test-prefix' });

			const req = { headers: {}, cookies: {} };
			const setHeader = jest.fn();
			const getHeader = () => {};
			const res = { setHeader, getHeader };
			const done = jest.fn();

			middleware(req, res, done);

			expect(req).toEqual({
				cookies: {},
				csrf: {
					token: '74657374',
					verified: false,
				},
				headers: {},
			});

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test-prefix=74657374%7C01df32396e63e90f0f3a1c57bfc9e677b2ef80111b188efced758e15be34e097; Path=/; HttpOnly; SameSite=Lax',
			]);
			expect(done).toBeCalledTimes(1);
		});
	});

	describe('throws', () => {
		test('throws on missing options', () => {
			expect.assertions(2);
			try {
				csrf();
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe('"options.origin" required.');
			}
		});
	});
});
