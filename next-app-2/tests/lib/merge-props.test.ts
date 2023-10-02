import { mergeProps } from '@/lib/merge-props';

describe('mergeProps', () => {
	it('should merge multiple props objects', () => {
		const props1 = { a: 1, b: 2 };
		const props2 = { b: 3, c: 4 };
		const result = mergeProps(props1, props2);
		expect(result).toEqual({ a: 1, b: 3, c: 4 });
	});

	it('should chain functions for event handlers', () => {
		const fn1 = jest.fn();
		const fn2 = jest.fn();
		const props1 = { onClick: fn1 };
		const props2 = { onClick: fn2 };
		const result = mergeProps(props1, props2);
		result.onClick();
		expect(fn1).toHaveBeenCalled();
		expect(fn2).toHaveBeenCalled();
	});

	it('should merge classnames', () => {
		const props1 = { className: 'class1' };
		const props2 = { className: 'class2' };
		const result = mergeProps(props1, props2);
		expect(result.className).toBe('class1 class2');
	});

	it('should override other props types', () => {
		const props1 = { a: 1, b: 'string1', c: true };
		const props2 = { a: 2, b: 'string2', c: false };
		const result = mergeProps(props1, props2);
		expect(result).toEqual({ a: 2, b: 'string2', c: false });
	});

	it('should handle null and undefined', () => {
		const props1 = { a: 1, b: 2 };
		const result = mergeProps(props1, null, undefined);
		expect(result).toEqual(props1);
	});
});
