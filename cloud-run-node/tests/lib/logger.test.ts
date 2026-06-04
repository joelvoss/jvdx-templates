import { afterEach, describe, expect, test, vi } from 'vitest';

import { createLogger } from '../../src/lib/logger';

describe('Logger', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('logger.info logs with INFO severity', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();
		let message = 'Test message';

		logger.info(message);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				severity: 'INFO',
				message,
			}),
		);
	});

	test('logger.warn logs with WARN severity', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();
		let message = 'Test message';

		logger.warn(message);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				severity: 'WARN',
				message,
			}),
		);
	});

	test('logger.error logs with ERROR severity', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();
		let message = 'Test message';

		logger.error(message);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				severity: 'ERROR',
				message,
			}),
		);
	});

	test('logger with object', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();
		let message = { message: 'Test message', foo: 'bar' };

		logger.error(message);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				severity: 'ERROR',
				...message,
			}),
		);
	});

	test('adds persistent context to later log entries', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();
		let message = 'Test message';

		logger.addContext({ 'logging.googleapis.com/trace': 'traceId' });
		logger.info(message);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				'logging.googleapis.com/trace': 'traceId',
				severity: 'INFO',
				message,
			}),
		);
	});

	test('merges persistent and per-log context with per-log values winning', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();

		logger.addContext({ requestId: 'request-1', source: 'middleware' });
		logger.error('Request failed', { code: 'NOT_FOUND', source: 'handler' });

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				requestId: 'request-1',
				source: 'handler',
				code: 'NOT_FOUND',
				severity: 'ERROR',
				message: 'Request failed',
			}),
		);
	});

	test('keeps context isolated between withContext calls', async () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();

		await logger.withContext({ requestId: 'first' }, async () => {
			logger.info('First request');
		});
		await logger.withContext({ requestId: 'second' }, async () => {
			logger.info('Second request');
		});

		expect(consoleSpy.mock.calls.map(([entry]) => JSON.parse(entry))).toEqual([
			{
				requestId: 'first',
				severity: 'INFO',
				message: 'First request',
			},
			{
				requestId: 'second',
				severity: 'INFO',
				message: 'Second request',
			},
		]);
	});

	test('preserves context across asynchronous work', async () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();

		await logger.withContext({ requestId: 'request-1' }, async () => {
			await Promise.resolve();
			logger.warn('Still handling request');
		});

		expect(JSON.parse(consoleSpy.mock.calls[0][0])).toEqual({
			requestId: 'request-1',
			severity: 'WARN',
			message: 'Still handling request',
		});
	});
});
