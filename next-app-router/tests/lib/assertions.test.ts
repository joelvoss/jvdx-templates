import {
	isNonNull,
	isArray,
	isString,
	isObject,
	isFunction,
	isDate,
	isRegExp,
} from '@/lib/assertions';

////////////////////////////////////////////////////////////////////////////////

describe('isNonNull', () => {
	it('should return true for non-null values', () => {
		expect(isNonNull('test')).toBe(true);
		expect(isNonNull(123)).toBe(true);
		expect(isNonNull([])).toBe(true);
		expect(isNonNull({})).toBe(true);
	});

	it('should return false for null or undefined', () => {
		expect(isNonNull(null)).toBe(false);
		expect(isNonNull(undefined)).toBe(false);
	});
});

////////////////////////////////////////////////////////////////////////////////

describe('isArray', () => {
	it('should return true for arrays', () => {
		expect(isArray([])).toBe(true);
		expect(isArray([1, 2, 3])).toBe(true);
	});

	it('should return false for non-arrays', () => {
		expect(isArray('test')).toBe(false);
		expect(isArray(123)).toBe(false);
		expect(isArray({})).toBe(false);
	});
});

////////////////////////////////////////////////////////////////////////////////

describe('isString', () => {
	it('should return true for strings', () => {
		expect(isString('test')).toBe(true);
	});

	it('should return false for non-strings', () => {
		expect(isString(123)).toBe(false);
		expect(isString([])).toBe(false);
		expect(isString({})).toBe(false);
	});
});

////////////////////////////////////////////////////////////////////////////////

describe('isObject', () => {
	it('should return true for objects', () => {
		expect(isObject({})).toBe(true);
		expect(isObject({ a: 1 })).toBe(true);
	});

	it('should return false for non-objects', () => {
		expect(isObject('test')).toBe(false);
		expect(isObject(123)).toBe(false);
		expect(isObject([])).toBe(false);
	});
});

////////////////////////////////////////////////////////////////////////////////

describe('isFunction', () => {
	it('should return true for functions', () => {
		expect(isFunction(() => {})).toBe(true);
		expect(isFunction(async () => {})).toBe(true);
	});

	it('should return false for non-functions', () => {
		expect(isFunction('test')).toBe(false);
		expect(isFunction(123)).toBe(false);
		expect(isFunction([])).toBe(false);
		expect(isFunction({})).toBe(false);
	});
});

////////////////////////////////////////////////////////////////////////////////

describe('isDate', () => {
	it('should return true for dates', () => {
		expect(isDate(new Date())).toBe(true);
	});

	it('should return false for non-dates', () => {
		expect(isDate('test')).toBe(false);
		expect(isDate(123)).toBe(false);
		expect(isDate([])).toBe(false);
		expect(isDate({})).toBe(false);
	});
});

////////////////////////////////////////////////////////////////////////////////

describe('isRegExp', () => {
	it('should return true for regular expressions', () => {
		expect(isRegExp(/test/)).toBe(true);
	});

	it('should return false for non-regular expressions', () => {
		expect(isRegExp('test')).toBe(false);
		expect(isRegExp(123)).toBe(false);
		expect(isRegExp([])).toBe(false);
		expect(isRegExp({})).toBe(false);
	});
});
