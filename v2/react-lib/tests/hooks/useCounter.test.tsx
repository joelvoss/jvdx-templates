import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCounter } from '../../src';

describe('useCounter', () => {
	it('should increment counter', () => {
		const { result } = renderHook(() => useCounter());
		act(() => {
			result.current.increment();
		});
		expect(result.current.count).toBe(1);
	});

	it('should decrement counter', () => {
		const { result } = renderHook(() => useCounter());
		act(() => {
			result.current.decrement();
		});
		expect(result.current.count).toBe(-1);
	});
});
