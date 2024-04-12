import { isNonNull } from '../src/helper/assertions';

describe('isNonNull', () => {
	test('base', () => {
		// @ts-expect-error
		expect(isNonNull()).toBe(false);
		expect(isNonNull(null)).toBe(false);
		expect(isNonNull(undefined)).toBe(false);

		expect(isNonNull(0)).toBe(true);
		expect(isNonNull('0')).toBe(true);
		expect(isNonNull(' ')).toBe(true);
	});
});
