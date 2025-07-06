import 'client-only';

import { type RefObject, useMemo, useRef } from 'react';

/**
 * Offers an object ref for a given callback ref or an object ref.
 */
export function useObjectRef<T>(
	forwardedRef?: ((instance: T | null) => void) | RefObject<T | null> | null,
): RefObject<T | null> {
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
