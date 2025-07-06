import 'client-only';

import { useCallback, useRef, useState } from 'react';
import { type Options, useQueryStateContext } from './context';
import { type Parser, safeParse } from './parser';
import {
	enqueueQueryStringUpdate,
	FLUSH_RATE_LIMIT_MS,
	getQueuedValue,
	scheduleFlushToURL,
} from './update-queue';

////////////////////////////////////////////////////////////////////////////////

interface QueryStateOptions<T> extends Parser<T>, Options {
	defaultValue?: T;
}

export type QueryStateReturnType<Parsed, Default> = [
	// NOTE(joel): Value can't be null if default is specified
	Default extends undefined ? Parsed | null : Parsed,
	(
		value:
			| null
			| Parsed
			| ((
					old: Default extends Parsed ? Parsed : Parsed | null,
			  ) => Parsed | null),
		options?: Options,
	) => Promise<URLSearchParams>,
];

////////////////////////////////////////////////////////////////////////////////

// Overload type signatures (Order matters; from the most specific to the
// least).

export function useQueryState<T>(
	key: string,
	options: QueryStateOptions<T> & { defaultValue: T },
): QueryStateReturnType<
	NonNullable<ReturnType<typeof options.parse>>,
	typeof options.defaultValue
>;

export function useQueryState<T>(
	key: string,
	options: QueryStateOptions<T>,
): QueryStateReturnType<
	NonNullable<ReturnType<typeof options.parse>>,
	undefined
>;

export function useQueryState(
	key: string,
	options: Options & {
		defaultValue: string;
	},
): QueryStateReturnType<string, typeof options.defaultValue>;

export function useQueryState(
	key: string,
	options: Pick<QueryStateOptions<string>, keyof Options>,
): QueryStateReturnType<string, undefined>;

export function useQueryState(
	key: string,
): QueryStateReturnType<string, undefined>;

////////////////////////////////////////////////////////////////////////////////

/**
 * useQueryState is a React hook that manages query state in the URL.
 */
export function useQueryState<T = string>(
	key: string,
	options?: Partial<QueryStateOptions<T>>,
) {
	const {
		history = 'replace',
		scroll = false,
		shallow = true,
		throttleMs = FLUSH_RATE_LIMIT_MS,
		parse = (x: unknown) => x as T,
		serialize = String,
		eq = (a: any, b: any) => a === b,
		defaultValue = undefined,
		clearOnDefault = true,
		startTransition,
	} = options || {};

	const ctx = useQueryStateContext();

	const initialValue = ctx.searchParams?.get(key);

	const [internalState, setInternalState] = useState<T | null>(() => {
		const queuedQuery = getQueuedValue(key);
		// NOTE(joel): If the queued query is undefined, we use the initial value.
		// This allows us to handle the case where the query state is not yet set.
		// If the queued query is null, we return null. This allows us to handle
		// the case where the query state is explicitly cleared.
		// If the queued query is a string, we parse it using the provided parse
		// function.
		const query = queuedQuery === undefined ? initialValue : queuedQuery;
		return query === null ? null : safeParse(parse, query);
	});

	const queryRef = useRef(initialValue);
	const stateRef = useRef(internalState);

	if (initialValue !== queryRef.current) {
		const state = initialValue === null ? null : safeParse(parse, initialValue);
		stateRef.current = state;
		queryRef.current = initialValue;
		setInternalState(state);
	}

	const update = useCallback(
		(stateUpdater: React.SetStateAction<T | null>, options: Options = {}) => {
			let newValue = isUpdaterFunction(stateUpdater)
				? stateUpdater(stateRef.current ?? defaultValue ?? null)
				: stateUpdater;

			if (
				(options.clearOnDefault ?? clearOnDefault) &&
				newValue !== null &&
				defaultValue !== undefined &&
				eq(newValue, defaultValue)
			) {
				newValue = null;
			}

			const query = enqueueQueryStringUpdate(key, newValue, serialize, {
				// Call-level options take precedence over hook declaration options.
				history: options.history ?? history,
				shallow: options.shallow ?? shallow,
				scroll: options.scroll ?? scroll,
				throttleMs: options.throttleMs ?? throttleMs,
				startTransition: options.startTransition ?? startTransition,
			});

			stateRef.current = newValue;
			queryRef.current = query;
			setInternalState(newValue);

			return scheduleFlushToURL(ctx);
		},
		[
			key,
			serialize,
			history,
			shallow,
			scroll,
			throttleMs,
			startTransition,
			clearOnDefault,
			defaultValue,
			eq,
			ctx,
		],
	);

	return [internalState ?? defaultValue ?? null, update];
}

////////////////////////////////////////////////////////////////////////////////

function isUpdaterFunction<T>(
	fn: React.SetStateAction<T>,
): fn is (prevState: T) => T {
	return typeof fn === 'function';
}
