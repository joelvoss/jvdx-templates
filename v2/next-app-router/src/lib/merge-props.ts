import type { TupleTypes, UnionToIntersection } from '@/types';

////////////////////////////////////////////////////////////////////////////////

interface Props {
	[key: string]: any;
}

type PropsArg = Props | null | undefined;

/**
 * Merges multiple props objects together. This is useful for merging props
 * objects from multiple sources, e.g. a component's props, a hook's props, and
 * a user's props.
 */
export function mergeProps<T extends PropsArg[]>(...args: T) {
	// NOTE(joel): Start with a base clone of the first argument. This is a lot
	// faster than starting with an empty object and adding properties as we go.
	const result: Props = { ...args[0] };
	for (let i = 1; i < args.length; i++) {
		const props = args[i];
		for (let key in props) {
			const a = result[key];
			const b = props[key];

			// NOTE(joel): Chain events, e.g. `onClick={a} onClick={b}` becomes
			// `onClick={a; b}`.
			if (
				typeof a === 'function' &&
				typeof b === 'function' &&
				// NOTE(joel): We could use a RegExp here, but this is a lot faster.
				// We check if the `key` starts with "on" and the third character is a
				// capital letter.
				key[0] === 'o' &&
				key[1] === 'n' &&
				key.charCodeAt(2) >= /* 'A' */ 65 &&
				key.charCodeAt(2) <= /* 'Z' */ 90
			) {
				result[key] = chainFns(a, b);

				// NOTE(joel): Merge classnames, sometimes classnames are empty strings
				// which eval to false, so we do a type check here.
			} else if (
				key === 'className' &&
				typeof a === 'string' &&
				typeof b === 'string'
			) {
				result[key] = chainClassNames(a, b);
				// NOTE(joel): Simply override all other props types.
			} else {
				result[key] = b !== undefined ? b : a;
			}
		}
	}

	return result as UnionToIntersection<TupleTypes<T>>;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Calls all functions in the order they were chained with the same arguments.
 */
function chainFns(...callbacks: any[]) {
	return (...args: any[]) => {
		for (let callback of callbacks) {
			if (typeof callback !== 'function') continue;
			callback(...args);
		}
	};
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Chains classnames together. This is simpler (and less code) than using a
 * library like `clsx`, since we only concatenate strings and not objects/
 * arrays.
 */
function chainClassNames(...args: string[]) {
	let str = '';

	let i = 0;
	while (i < args.length) {
		const v = args[i++];
		if (v == null) continue;
		if (str) str += ' ';
		str += v;
	}

	return str;
}
