import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('HTTPException', () => {
	let HTTPException: typeof import('~/lib/http-exception').HTTPException;

	beforeEach(async () => {
		vi.resetModules();
		HTTPException = (await import('../../src/lib/http-exception'))
			.HTTPException;
	});

	test('should create an instance with default values', () => {
		let exception = new HTTPException();
		expect(exception.status).toBe(500);
		expect(exception.message).toBe('');
		expect(exception.code).toBe(undefined);
		expect(exception.res).toBe(undefined);
	});

	test('should create an instance with provided values', () => {
		let exception = new HTTPException(404, {
			message: 'Not Found',
			code: 'NOT_FOUND',
			res: new Response(null, { status: 404 }),
		});

		expect(exception.status).toBe(404);
		expect(exception.message).toBe('Not Found');
		expect(exception.code).toBe('NOT_FOUND');
		expect(exception.res).toBeInstanceOf(Response);
	});

	test('getResponse should return the provided response if it exists', () => {
		let response = new Response(null, { status: 404 });
		let exception = new HTTPException(404, {
			res: response,
		});

		expect(exception.getResponse()).toBe(response);
	});

	test('getResponse should create a new response if none was provided', async () => {
		let exception = new HTTPException(404, {
			message: 'Not Found',
			code: 'NOT_FOUND',
		});

		let response = exception.getResponse();

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(404);
		expect(response.headers.get('content-type')).toBe(
			'application/json; charset=UTF-8',
		);

		let body = JSON.parse(await response.text());
		expect(body.message).toBe('Not Found');
		expect(body.code).toBe('NOT_FOUND');
	});
});
