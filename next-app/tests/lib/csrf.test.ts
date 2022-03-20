// @ts-nocheck

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

			const req = { headers: { origin: 'http://localhost:3000' }, cookies: {} };
			const setHeader = jest.fn();
			const getHeader = () => {};
			const res = { setHeader, getHeader };
			const done = jest.fn();

			middleware(req, res, done);

			expect(req).toEqual({
				...req,
				csrf: { token: '74657374', verified: false },
			});

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'XSRF-TOKEN=74657374%7Ced938d57e84ead01cc7b23fff5aa24ff4f3884465ae96a88f5ab26895f6cd474; Path=/; HttpOnly; SameSite=Lax',
			]);
			expect(done).toBeCalledTimes(1);
		});

		test('validates csrf token in request', () => {
			const middleware = csrf({ origin: true });

			const req = {
				headers: {
					'x-xsrf-token': '74657374',
					origin: 'http://localhost:3000',
				},
				cookies: {
					'XSRF-TOKEN':
						'74657374|ed938d57e84ead01cc7b23fff5aa24ff4f3884465ae96a88f5ab26895f6cd474',
				},
			};
			const setHeader = jest.fn();
			const getHeader = () => {};
			const res = { setHeader, getHeader };
			const done = jest.fn();

			middleware(req, res, done);

			expect(req).toEqual({
				...req,
				csrf: { token: '74657374', verified: true },
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
				...req,
				csrf: { token: '74657374', verified: false },
			});

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'__Host-XSRF-TOKEN=74657374%7Cab3791af2237e52b0e4b0f9e9bf24a3a5f78cb0fedf8f9055c519a00f6bf40b3; Path=/; HttpOnly; Secure; SameSite=Lax',
			]);
			expect(done).toBeCalledTimes(1);
		});

		test('"prefix" option', () => {
			const middleware = csrf({ origin: true, prefix: 'test-prefix' });

			const req = { headers: { origin: 'http://localhost:3000' }, cookies: {} };
			const setHeader = jest.fn();
			const getHeader = () => {};
			const res = { setHeader, getHeader };
			const done = jest.fn();

			middleware(req, res, done);

			expect(req).toEqual({
				...req,
				csrf: { token: '74657374', verified: false },
			});

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test-prefix=74657374%7Ced938d57e84ead01cc7b23fff5aa24ff4f3884465ae96a88f5ab26895f6cd474; Path=/; HttpOnly; SameSite=Lax',
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
