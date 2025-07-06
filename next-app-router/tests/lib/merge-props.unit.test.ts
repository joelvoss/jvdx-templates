import { describe, expect, it, vi } from 'vitest';
import { mergeProps } from '@/lib/merge-props';

describe('mergeProps', () => {
	it('merges multiple objects', () => {
		const a = { foo: 1, bar: 2 };
		const b = { bar: 3, baz: 4 };
		expect(mergeProps(a, b)).toEqual({ foo: 1, bar: 3, baz: 4 });
	});

	it('chains event handlers for onX props', () => {
		const fn1 = vi.fn();
		const fn2 = vi.fn();
		const merged = mergeProps({ onClick: fn1 }, { onClick: fn2 });
		merged.onClick();
		expect(fn1).toHaveBeenCalled();
		expect(fn2).toHaveBeenCalled();
	});

	it('merges className strings', () => {
		const merged = mergeProps({ className: 'a' }, { className: 'b' });
		expect(merged.className).toMatch(/a/);
		expect(merged.className).toMatch(/b/);
	});

	it('overrides with last value for other keys', () => {
		const merged = mergeProps({ foo: 1 }, { foo: 2 });
		expect(merged.foo).toBe(2);
	});
});
