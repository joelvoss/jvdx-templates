import type { RefObject } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { useObjectRef } from '@/lib/use-object-ref';

describe('useObjectRef', () => {
	it('returns a ref object with current property', async () => {
		const { result } = await renderHook(() => useObjectRef<HTMLInputElement>());
		expect(result.current).toHaveProperty('current');
		expect(result.current.current).toBe(null);
	});

	it('updates current and calls callback ref', async () => {
		const cb = vi.fn();
		const { act, result } = await renderHook(() =>
			useObjectRef<HTMLInputElement>(cb),
		);
		act(() => {
			result.current.current = { value: 'test' } as any;
		});
		expect(cb).toHaveBeenCalledWith({ value: 'test' });
		expect(result.current.current).toEqual({ value: 'test' });
	});

	it('updates current and sets forwarded object ref', async () => {
		const forwarded: RefObject<HTMLInputElement> = { current: null };
		const { act, result } = await renderHook(() =>
			useObjectRef<HTMLInputElement>(forwarded),
		);
		act(() => {
			result.current.current = { value: 'foo' } as any;
		});
		expect(forwarded.current).toEqual({ value: 'foo' });
		expect(result.current.current).toEqual({ value: 'foo' });
	});

	it('works with no forwarded ref', async () => {
		const { act, result } = await renderHook(() =>
			useObjectRef<HTMLInputElement>(),
		);
		act(() => {
			result.current.current = { value: 'bar' } as any;
		});
		expect(result.current.current).toEqual({ value: 'bar' });
	});
});
