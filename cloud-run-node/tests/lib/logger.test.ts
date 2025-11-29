import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { LogContext } from '~/lib/logger';

describe('Logger', () => {
	let logger: typeof import('~/lib/logger').logger;

	beforeEach(async () => {
		vi.resetModules();
		logger = (await import('../../src/lib/logger')).logger;
	});

	test('logger.info logs with INFO severity', () => {
		let consoleSpy = vi.spyOn(console, 'log');
		let message = 'Test message';
		let context = { get: () => 'traceId' } as unknown as LogContext;

		logger.info(message, context);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				severity: 'INFO',
				'logging.googleapis.com/trace': 'traceId',
				message,
			}),
		);

		consoleSpy.mockRestore();
	});

	test('logger.warn logs with WARN severity', () => {
		let consoleSpy = vi.spyOn(console, 'log');
		let message = 'Test message';
		let context = { get: () => 'traceId' } as unknown as LogContext;

		logger.warn(message, context);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				severity: 'WARN',
				'logging.googleapis.com/trace': 'traceId',
				message,
			}),
		);

		consoleSpy.mockRestore();
	});

	test('logger.error logs with ERROR severity', () => {
		let consoleSpy = vi.spyOn(console, 'log');
		let message = 'Test message';
		let context = { get: () => 'traceId' } as unknown as LogContext;

		logger.error(message, context);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				severity: 'ERROR',
				'logging.googleapis.com/trace': 'traceId',
				message,
			}),
		);

		consoleSpy.mockRestore();
	});

	test('logger without context', () => {
		let consoleSpy = vi.spyOn(console, 'log');
		let message = 'Test message';

		logger.error(message);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				severity: 'ERROR',
				message,
			}),
		);

		consoleSpy.mockRestore();
	});

	test('logger with object', () => {
		let consoleSpy = vi.spyOn(console, 'log');
		let message = { message: 'Test message', foo: 'bar' };

		logger.error(message);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				severity: 'ERROR',
				...message,
			}),
		);

		consoleSpy.mockRestore();
	});
});
