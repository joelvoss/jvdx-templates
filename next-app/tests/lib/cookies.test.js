import { setCookie } from '@/lib/cookies';

describe('setCookie', () => {
	describe('base', () => {
		test('sets a cookie string', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value');

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=/',
			]);
		});

		test('handle objects as cookie values', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', { field: 'value' });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=j%3A%7B%22field%22%3A%22value%22%7D; Path=/',
			]);
		});

		test('preserves existing cookies', () => {
			const getHeader = () => 'type=ninja';
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value');

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'type=ninja',
				'test=test-value; Path=/',
			]);
		});
	});

	describe('options', () => {
		test('encode', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', '- ', { encode: v => v });

			expect(setHeader).toBeCalledWith('Set-Cookie', ['test=- ; Path=/']);
		});

		test('maxAge', () => {
			const realDateNow = Date.now;
			Date.now = jest.fn(() => 1636825205896);

			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { maxAge: 2000 });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Max-Age=2; Path=/; Expires=Sat, 13 Nov 2021 17:40:07 GMT',
			]);

			Date.now = realDateNow;
		});

		test('domain', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { domain: 'test-domain' });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Domain=test-domain; Path=/',
			]);
		});

		test('path', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { path: 'test-path' });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=test-path',
			]);
		});

		test('expires (date)', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', {
				expires: new Date(Date.UTC(2021, 0, 1, 0, 0, 0, 0)),
			});

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=/; Expires=Fri, 01 Jan 2021 00:00:00 GMT',
			]);
		});

		test('expires (string)', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { expires: 1 });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
			]);
		});

		test('httpOnly', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { httpOnly: true });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=/; HttpOnly',
			]);
		});

		test('secure', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { secure: true });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=/; Secure',
			]);
		});

		test('sameSite (boolean)', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { sameSite: true });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=/; SameSite=Strict',
			]);
		});

		test('sameSite (strict)', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { sameSite: 'strict' });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=/; SameSite=Strict',
			]);
		});

		test('sameSite (lax)', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { sameSite: 'lax' });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=/; SameSite=Lax',
			]);
		});

		test('sameSite (none)', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { sameSite: 'none' });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=/; SameSite=None',
			]);
		});

		test('sameSite (uppercased string)', () => {
			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			setCookie(res, 'test', 'test-value', { sameSite: 'STRICT' });

			expect(setHeader).toBeCalledWith('Set-Cookie', [
				'test=test-value; Path=/; SameSite=Strict',
			]);
		});
	});

	describe('throws', () => {
		test('encode', () => {
			expect.assertions(2);

			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			try {
				setCookie(res, 'test', '- ', { encode: 'will-throw' });
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe('"option.encode" is invalid');
			}
		});

		test('name', () => {
			expect.assertions(2);

			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			try {
				setCookie(res, 'will-throw\n', 'value');
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe('"name" is invalid');
			}
		});

		test('val', () => {
			expect.assertions(2);

			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			try {
				setCookie(res, 'test', 'value\n', { encode: v => v });
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe('"val" is invalid');
			}
		});

		test('maxAge', () => {
			expect.assertions(4);

			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			try {
				setCookie(res, 'test', 'value', { maxAge: 'string' });
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe('"option.maxAge" is invalid');
			}

			try {
				setCookie(res, 'test', 'value', { maxAge: Infinity });
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe('"option.maxAge" is invalid');
			}
		});

		test('domain', () => {
			expect.assertions(2);

			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			try {
				setCookie(res, 'test', 'value', { domain: 'will-throw\n' });
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe('"option.domain" is invalid');
			}
		});

		test('path', () => {
			expect.assertions(2);

			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			try {
				setCookie(res, 'test', 'value', { path: 'will-throw\n' });
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe('"option.path" is invalid');
			}
		});

		test('sameSite', () => {
			expect.assertions(2);

			const getHeader = () => {};
			const setHeader = jest.fn();
			const res = { setHeader, getHeader };

			try {
				setCookie(res, 'test', 'value', { sameSite: 'will-throw\n' });
			} catch (err) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe('"option.sameSite" is invalid');
			}
		});
	});
});
