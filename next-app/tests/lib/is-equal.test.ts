import { isEqual } from '@/lib/assertions';

describe('isEqual', () => {
	test('returns false on inequality', () => {
		const equal = isEqual(['first', 'args'], ['second', 'args']);
		expect(equal).toBe(false);
	});

	test('returns true on equality', () => {
		let equal = isEqual(['first', 'args'], ['first', 'args']);
		expect(equal).toBe(true);

		equal = isEqual([{ first: 'obj' }], [{ first: 'obj' }]);
		expect(equal).toBe(true);
	});

	test('returns false if arguments change length', () => {
		const equal = isEqual(['first', 'args'], ['first', 'args', 'whoops']);
		expect(equal).toBe(false);
	});
});
