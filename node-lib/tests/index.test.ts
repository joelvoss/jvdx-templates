import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('calculator', () => {
	let calculator: typeof import('../src/index').calculator;

	beforeEach(async () => {
		vi.restoreAllMocks();
		vi.resetModules();
		calculator = (await import('../src/index')).calculator;
	});

	test('returns the sum when using the add operation', () => {
		expect(calculator('add', 4, 6)).toBe(10);
	});

	test('logs and returns -1 when using an unsupported operation', () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

		expect(calculator('multiply', 2, 3)).toBe(-1);
		expect(logSpy).toHaveBeenCalledWith('Invalid operation');
	});

	test('propagates NaN when insufficient operands are provided', () => {
		expect(Number.isNaN(calculator('add', 4))).toBe(true);
	});
});
