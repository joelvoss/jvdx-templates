import { NetworkError } from '../src/helper/network-error';

describe('NetworkError', () => {
	it(`should contain name, message and status`, async () => {
		const err = new NetworkError('test-message');

		expect(err.name).toBe('NetworkError');
		expect(err.message).toBe('test-message');
		expect(err.status).toBe(500);
	});

	it(`should allow setting a custom status code`, async () => {
		const err = new NetworkError('test-message', 400);

		expect(err.name).toBe('NetworkError');
		expect(err.message).toBe('test-message');
		expect(err.status).toBe(400);
	});

	it(`should contain the original error`, async () => {
		const err = new NetworkError('test-message');

		expect(err.originalError).toStrictEqual(new Error('test-message'));
	});
});
