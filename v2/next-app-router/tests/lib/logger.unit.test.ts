import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '@/lib/logger';

describe('log', () => {
	let spy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		spy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});
	afterEach(() => {
		spy.mockRestore();
	});

	it('logs info with NOTICE severity', () => {
		log.info('info message');
		expect(spy).toHaveBeenCalledWith(
			JSON.stringify({ severity: 'NOTICE', message: 'info message' }),
		);
	});

	it('logs warning with WARNING severity', () => {
		log.warn('warn message');
		expect(spy).toHaveBeenCalledWith(
			JSON.stringify({ severity: 'WARNING', message: 'warn message' }),
		);
	});

	it('logs error with ERROR severity', () => {
		log.error('error message');
		expect(spy).toHaveBeenCalledWith(
			JSON.stringify({ severity: 'ERROR', message: 'error message' }),
		);
	});
});
