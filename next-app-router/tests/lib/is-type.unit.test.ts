import { describe, expect, it } from 'vitest';
import { isType } from '@/lib/is-type';

describe('isType', () => {
	it('detects string', () => {
		expect(isType('foo', 'string')).toBe(true);
		expect(isType(new String('bar'), 'string')).toBe(true);
		expect(isType(123, 'string')).toBe(false);
	});

	it('detects number', () => {
		expect(isType(123, 'number')).toBe(true);
		expect(isType('123', 'number')).toBe(false);
	});

	it('detects boolean', () => {
		expect(isType(true, 'boolean')).toBe(true);
		expect(isType(false, 'boolean')).toBe(true);
		expect(isType('true', 'boolean')).toBe(false);
	});

	it('detects function', () => {
		expect(isType(() => {}, 'function')).toBe(true);
		expect(isType(function () {}, 'function')).toBe(true);
		expect(isType({}, 'function')).toBe(false);
	});

	it('detects object', () => {
		expect(isType({}, 'object')).toBe(true);
		expect(isType([], 'object')).toBe(true);
		expect(isType(null, 'object')).toBe(false);
	});

	it('detects symbol', () => {
		expect(isType(Symbol('x'), 'symbol')).toBe(true);
		expect(isType('symbol', 'symbol')).toBe(false);
	});

	it('detects undefined', () => {
		expect(isType(undefined, 'undefined')).toBe(true);
		expect(isType(null, 'undefined')).toBe(false);
	});
});
