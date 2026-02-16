import { useLayoutEffect } from "react";

import { useLatest } from "~/hooks/use-latest";

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): DOM event targets commonly have two addEventListener overloads.
// We extract the type from both, but the first overload takes precedence
// since it's typically more specific.
// The second overload can be ignored since it's typically a generic fallback
// accepting bare `string`. We use `infer _T2` instead of `any` because we
// don't need this type and want to avoid type assignability issues (since
// `any` cannot be assigned to `never`).
type InferEventType<Target> = Target extends {
	addEventListener(type: infer T, ...args: any): void;
	addEventListener(type: infer _T2, ...args: any): void;
}
	? T & string
	: never;

// NOTE(joel): Infers the event object type for a given event type string.
// It checks if the target has a corresponding `on${Type}` handler property
// (e.g., `onclick` for "click"). If so, it extracts the first parameter type
// from that handler function, which is the event type. Otherwise, it falls
// back to the generic `Event` type.
type InferEvent<Target, Type extends string> = `on${Type}` extends keyof Target
	? Parameters<Extract<Target[`on${Type}`], (...args: any[]) => any>>[0]
	: Event;

/**
 * A hook that attaches an event listener to a target and ensures the latest
 * version of the listener is called when the event is triggered.
 */
export function useListener<
	Target extends EventTarget,
	Type extends InferEventType<Target>,
>(
	target: Target,
	type: Type,
	listener: (event: InferEvent<Target, Type>) => void,
) {
	const latestListener = useLatest(listener);
	useLayoutEffect(() => {
		const handler: typeof listener = (event) => latestListener.current(event);
		if (!target) return;
		target.addEventListener(type, handler);
		return () => target.removeEventListener(type, handler);
	}, [latestListener, target, type]);
}
