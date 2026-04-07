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

	test('throws when using an unsupported operation', () => {
		expect(() => calculator('multiply', 2, 3)).toThrow(
			'Unsupported operation: multiply',
		);
	});

	test('throws when insufficient operands are provided', () => {
		expect(() => calculator('add', 4)).toThrow(
			'Operation "add" requires at least 2 operands',
		);
	});
});
