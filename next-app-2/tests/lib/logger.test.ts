// @ts-nocheck

import { log } from '@/lib/logger';

describe('warn', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should log a basic warn messages', () => {
		const logSpy = jest.spyOn(global.console, 'log');
		logSpy.mockImplementation(() => {});
		log.warn('test');
		expect(logSpy).toBeCalledWith('{"severity":"WARNING","message":"test"}');
	});
});

describe('info', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should log a basic error messages', () => {
		const spy = jest.spyOn(global.console, 'log');
		spy.mockImplementation(() => {});

		log.error('test');
		expect(spy).toBeCalledWith('{"severity":"ERROR","message":"test"}');
	});
});
