import { useMemo, useRef } from 'react';

import type { MutableRefObject } from 'react';

/**
 * Offers an object ref for a given callback ref or an object ref.
 */
export function useObjectRef<T>(
	forwardedRef?:
		| ((instance: T | null) => void)
		| MutableRefObject<T | null>
		| null,
): MutableRefObject<T | null> {
	const objRef = useRef<T | null>(null);
	return useMemo(
		() => ({
			get current() {
				return objRef.current;
			},
			set current(value) {
				objRef.current = value;
				if (typeof forwardedRef === 'function') {
					forwardedRef(value);
				} else if (forwardedRef) {
					forwardedRef.current = value;
				}
			},
		}),
		[forwardedRef],
	);
}
