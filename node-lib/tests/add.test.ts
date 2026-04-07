import { describe, expect, test } from 'vitest';

import { add } from '../src/add';

describe('add', () => {
	test('adds two positive numbers', () => {
		expect(add(2, 3)).toBe(5);
	});

	test('adds two negative numbers', () => {
		expect(add(-4, -6)).toBe(-10);
	});

	test('handles mixed-sign inputs', () => {
		expect(add(-2, 5)).toBe(3);
	});
});
