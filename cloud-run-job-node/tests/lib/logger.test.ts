import { afterEach, describe, expect, test, vi } from 'vitest';

import { createLogger } from '../../src/lib/logger';

////////////////////////////////////////////////////////////////////////////////

describe('createLogger', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('writes info logs as JSON with severity and message', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();

		logger.info('Job started');

		expect(consoleSpy).toHaveBeenCalledTimes(1);
		expect(JSON.parse(consoleSpy.mock.calls[0][0])).toEqual({
			severity: 'INFO',
			message: 'Job started',
		});
	});

	test('writes warn and error logs with their severities', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();

		logger.warn('Retrying task');
		logger.error('Task failed');

		expect(consoleSpy.mock.calls.map(([entry]) => JSON.parse(entry))).toEqual([
			{
				severity: 'WARN',
				message: 'Retrying task',
			},
			{
				severity: 'ERROR',
				message: 'Task failed',
			},
		]);
	});

	test('adds persistent context to later log entries', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();

		logger.addContext({ taskIndex: '2', taskAttempt: '1' });
		logger.info('Task context attached');

		expect(JSON.parse(consoleSpy.mock.calls[0][0])).toEqual({
			taskIndex: '2',
			taskAttempt: '1',
			severity: 'INFO',
			message: 'Task context attached',
		});
	});

	test('merges persistent and per-log context with per-log values winning', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();

		logger.addContext({ taskIndex: '2', source: 'job' });
		logger.error('Book processing failed', {
			bookId: 'book-1',
			source: 'processor',
		});

		expect(JSON.parse(consoleSpy.mock.calls[0][0])).toEqual({
			taskIndex: '2',
			source: 'processor',
			bookId: 'book-1',
			severity: 'ERROR',
			message: 'Book processing failed',
		});
	});

	test('keeps context isolated between logger instances', () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let firstLogger = createLogger();
		let secondLogger = createLogger();

		firstLogger.addContext({ taskIndex: '1' });
		firstLogger.info('First task');
		secondLogger.info('Second task');

		expect(consoleSpy.mock.calls.map(([entry]) => JSON.parse(entry))).toEqual([
			{
				taskIndex: '1',
				severity: 'INFO',
				message: 'First task',
			},
			{
				severity: 'INFO',
				message: 'Second task',
			},
		]);
	});

	test('preserves context across asynchronous work', async () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let logger = createLogger();

		logger.addContext({ taskAttempt: '3' });
		await Promise.resolve();
		logger.warn('Still retrying');

		expect(JSON.parse(consoleSpy.mock.calls[0][0])).toEqual({
			taskAttempt: '3',
			severity: 'WARN',
			message: 'Still retrying',
		});
	});
});
