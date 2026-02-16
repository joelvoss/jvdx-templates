import { useRef } from "react";

import { useIsomorphicLayoutEffect } from "~/hooks/use-isomorphic-layout-effect";

/**
 * A hook that returns a ref object containing the latest value.
 * This is useful for accessing the most recent value in event handlers
 * or effects without needing to add the value to the dependency array.
 */
export function useLatest<T>(value: T) {
	const ref = useRef(value);

	useIsomorphicLayoutEffect(() => {
		ref.current = value;
	});

	return ref;
}
