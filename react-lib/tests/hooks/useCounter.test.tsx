import { describe, expect, it } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { useCounter } from '../../src';

describe('useCounter', () => {
	it('should increment counter', async () => {
		const { result, act } = await renderHook(() => useCounter());
		act(() => {
			result.current.increment();
		});
		expect(result.current.count).toBe(1);
	});

	it('should decrement counter', async () => {
		const { result, act } = await renderHook(() => useCounter());
		act(() => {
			result.current.decrement();
		});
		expect(result.current.count).toBe(-1);
	});
});
