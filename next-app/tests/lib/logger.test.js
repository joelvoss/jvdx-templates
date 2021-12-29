import { info, error } from '@/lib/logger';

describe('info', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should log a basic info messages', () => {
		const logSpy = jest.spyOn(global.console, 'log');
		logSpy.mockImplementation(() => {});
		info('test');
		expect(logSpy).toBeCalledWith('info - ', 'test');
	});

	it('should log a complex info messages', () => {
		const logSpy = jest.spyOn(global.console, 'log');
		logSpy.mockImplementation(() => {});
		info('test', { obj: 'value ' });
		expect(logSpy).toBeCalledWith('info - ', 'test', { obj: 'value ' });
	});
});

describe('info', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should log a basic error messages', () => {
		const spy = jest.spyOn(global.console, 'error');
		spy.mockImplementation(() => {});

		error('test');
		expect(spy).toBeCalledWith('err - ', 'test');
	});

	it('should log a complex error messages', () => {
		const spy = jest.spyOn(global.console, 'error');
		spy.mockImplementation(() => {});

		error('test', { obj: 'value ' });
		expect(spy).toBeCalledWith('err - ', 'test', { obj: 'value ' });
	});
});
