import { useCallback, useRef } from "react";

////////////////////////////////////////////////////////////////////////////////

/**
 * Updates a ref (callback or object) with the given instance.
 */
function updateRef<T>(ref: React.Ref<T>, instance: T | null) {
	if (typeof ref === "function") {
		ref(instance);
		return;
	}
	if (ref == null) return;
	ref.current = instance;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * A hook that composes a library ref and a user ref into a single ref callback.
 * When the returned ref callback is invoked, it updates both the library ref
 * and the user ref with the same instance.
 */
export function useComposedRef<T extends HTMLElement>(
	libRef: React.RefObject<T | null>,
	userRef: React.Ref<T>,
) {
	const prevUserRef = useRef<React.Ref<T>>(null);

	return useCallback(
		(instance: T | null) => {
			libRef.current = instance;

			if (prevUserRef.current) {
				updateRef(prevUserRef.current, null);
			}

			prevUserRef.current = userRef;

			if (!userRef) return;
			updateRef(userRef, instance);
		},
		[libRef, userRef],
	);
}
