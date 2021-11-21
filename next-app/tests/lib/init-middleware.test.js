import { initMiddleware } from '@/lib/init-middleware';

describe('initMiddleware', () => {
	test('await a given middleware', async () => {
		const testMiddleware = (req, res, next) => {
			req('test first arg');
			res('test second arg');
			next('call next');
		};
		const middleware = initMiddleware(testMiddleware);

		const req = jest.fn();
		const res = jest.fn();
		const returnValue = await middleware(req, res);

		expect(req).toBeCalledWith('test first arg');
		expect(res).toBeCalledWith('test second arg');
		expect(returnValue).toBe('call next');
	});

	test('throw on errors in a given middleware', async () => {
		expect.assertions(3);

		const testMiddleware = (req, res, next) => {
			throw new Error('test-error');
			// eslint-disable-next-line no-unreachable
			req('test first arg');
			res('test second arg');
			next('call next');
		};
		const middleware = initMiddleware(testMiddleware);

		const req = jest.fn();
		const res = jest.fn();

		try {
			await middleware(req, res);
		} catch (err) {
			expect(req).not.toBeCalled();
			expect(res).not.toBeCalled();
			expect(err.message).toBe('test-error');
		}
	});
});
