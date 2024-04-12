// @ts-nocheck

import { getMethod } from '@/lib/get-method';

describe('getMethod', () => {
	describe('base', () => {
		test('returns a normalized method', () => {
			const req = { method: 'get' };
			const method = getMethod(req);
			expect(method).toBe('GET');
		});
	});
});
