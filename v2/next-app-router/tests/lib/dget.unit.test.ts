import { describe, expect, it } from 'vitest';
import { dget } from '@/lib/dget';

describe('dget', () => {
	const obj = {
		a: { b: { c: 1 }, arr: [10, 20, 30] },
		x: null,
		y: undefined,
		z: 0,
	};

	it('gets value by dot-notated string', () => {
		expect(dget(obj, 'a.b.c')).toBe(1);
		expect(dget(obj, 'a.arr.1')).toBe(20);
		expect(dget(obj, 'a.arr[2]')).toBe(30);
	});

	it('gets value by array path', () => {
		expect(dget(obj, ['a', 'b', 'c'])).toBe(1);
		expect(dget(obj, ['a', 'arr', 0])).toBe(10);
	});

	it('returns fallback for missing key', () => {
		expect(dget(obj, 'a.b.d', 'fallback')).toBe('fallback');
		expect(dget(obj, 'notfound', 'fallback')).toBe('fallback');
	});

	it('returns null if value is null', () => {
		expect(dget(obj, 'x', 'fallback')).toBe(null);
	});

	it('returns fallback if value is undefined', () => {
		expect(dget(obj, 'y', 'fallback')).toBe('fallback');
	});

	it('returns value if value is 0', () => {
		expect(dget(obj, 'z', 'fallback')).toBe(0);
	});
});
