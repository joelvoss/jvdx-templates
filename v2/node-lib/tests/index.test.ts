import { expect, test } from 'vitest';
import { calculator } from '../src/index';

test('adds 1 + 2 to equal 3', () => {
	expect(calculator('add', 1, 2)).toBe(3);
});
