import type { AdapterInterface, Options } from './context';

////////////////////////////////////////////////////////////////////////////////

export const FLUSH_RATE_LIMIT_MS = getFlushRateLimitMs();

/**
 * Returns the flush rate limit in milliseconds based on the browser.
 * This is used to determine how often the query state should be flushed
 * to the URL.
 */
export function getFlushRateLimitMs() {
	if (typeof window === 'undefined') return 50;

	// NOTE(joel): GestureEvent is only implemented in Safari
	// @see https://caniuse.com/?search=GestureEvent
	if ('GestureEvent' in window) {
		try {
			const match = navigator.userAgent?.match(/version\/([\d.]+) safari/i);
			return Number.parseFloat(match?.[1] || '') >= 17 ? 120 : 320;
		} catch {
			return 320;
		}
	}

	// NOTE(joel): Chrome and Firefox have a default rate limit of 50ms
	return 50;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the current search parameters from the URL.
 */
function getSearchParamsSnapshotFromLocation() {
	return new URLSearchParams(location.search);
}

////////////////////////////////////////////////////////////////////////////////

const updateQueue = new Map<string, string | null>();
const transitionsQueue: Set<React.TransitionStartFunction> = new Set();

let queueOptions: Required<
	Omit<Options, 'startTransition' | 'clearOnDefault'>
> = {
	history: 'replace',
	scroll: false,
	shallow: true,
	throttleMs: FLUSH_RATE_LIMIT_MS,
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the current search parameters from the update queue.
 */
export function getQueuedValue(key: string) {
	return updateQueue.get(key);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Resets the update queue and options to their initial state.
 */
function resetQueue() {
	updateQueue.clear();
	transitionsQueue.clear();
	queueOptions.history = 'replace';
	queueOptions.scroll = false;
	queueOptions.shallow = true;
	queueOptions.throttleMs = FLUSH_RATE_LIMIT_MS;
}

////////////////////////////////////////////////////////////////////////////////

export function enqueueQueryStringUpdate<T>(
	key: string,
	value: T | null,
	serialize: (value: T) => string,
	options: Pick<
		Options,
		'history' | 'scroll' | 'shallow' | 'startTransition' | 'throttleMs'
	>,
) {
	const serializedOrNull = value === null ? null : serialize(value);
	updateQueue.set(key, serializedOrNull);
	// Any item can override an option for the whole batch of updates
	if (options.history === 'push') {
		queueOptions.history = 'push';
	}
	if (options.scroll) {
		queueOptions.scroll = true;
	}
	if (options.shallow === false) {
		queueOptions.shallow = false;
	}
	if (options.startTransition) {
		transitionsQueue.add(options.startTransition);
	}
	queueOptions.throttleMs = Math.max(
		options.throttleMs ?? FLUSH_RATE_LIMIT_MS,
		Number.isFinite(queueOptions.throttleMs) ? queueOptions.throttleMs : 0,
	);
	return serializedOrNull;
}

////////////////////////////////////////////////////////////////////////////////

let lastFlushTimestamp = 0;
let flushPromiseCache: Promise<URLSearchParams> | null = null;

export function scheduleFlushToURL(
	options: Pick<
		AdapterInterface,
		'updateUrl' | 'getSearchParamsSnapshot' | 'rateLimitFactor'
	>,
) {
	const {
		getSearchParamsSnapshot = getSearchParamsSnapshotFromLocation,
		updateUrl,
		rateLimitFactor = 1,
	} = options;

	// NOTE(joel): If a flush is already scheduled, return the cached promise.
	if (flushPromiseCache !== null) return flushPromiseCache;

	flushPromiseCache = new Promise<URLSearchParams>((resolve, reject) => {
		if (!Number.isFinite(queueOptions.throttleMs)) {
			resolve(getSearchParamsSnapshot());
			// NOTE(joel): Reset the cache after resolving to avoid memory leaks.
			setTimeout(() => {
				flushPromiseCache = null;
			}, 0);
			return;
		}

		function flushNow() {
			lastFlushTimestamp = performance.now();
			const [search, error] = flushUpdateQueue({
				updateUrl,
				getSearchParamsSnapshot,
			});
			if (error === null) {
				resolve(search);
			} else {
				reject(search);
			}
			flushPromiseCache = null;
		}

		// NOTE(joel): We run the logic on the next event loop tick to allow
		// multiple query updates to set their own throttleMs value.
		function runOnNextTick() {
			const now = performance.now();
			const timeSinceLastFlush = now - lastFlushTimestamp;
			const throttleMs = queueOptions.throttleMs;
			const flushInMs =
				rateLimitFactor *
				Math.max(0, Math.min(throttleMs, throttleMs - timeSinceLastFlush));
			if (flushInMs === 0) {
				// NOTE(joel): Since we're already in the "next tick" from queued
				// updates, no need to do setTimeout(0) here.
				flushNow();
			} else {
				setTimeout(flushNow, flushInMs);
			}
		}
		setTimeout(runOnNextTick, 0);
	});
}

////////////////////////////////////////////////////////////////////////////////

function flushUpdateQueue(
	payload: Pick<
		Required<AdapterInterface>,
		'updateUrl' | 'getSearchParamsSnapshot'
	>,
): [URLSearchParams, null | unknown] {
	const { updateUrl, getSearchParamsSnapshot } = payload;

	const search = getSearchParamsSnapshot();
	if (updateQueue.size === 0) return [search, null];

	// NOTE(joel): We need to copy the entries to avoid modifying the
	// original Map while iterating over it.
	const items = Array.from(updateQueue.entries());
	const options = { ...queueOptions };
	const transitions = Array.from(transitionsQueue);

	// NOTE(joel): Reset the queues to avoid flushing the same updates again.
	resetQueue();

	for (const [key, value] of items) {
		if (value === null) {
			search.delete(key);
		} else {
			search.set(key, value);
		}
	}

	try {
		compose(transitions, () => {
			updateUrl(search, {
				history: options.history,
				scroll: options.scroll,
				shallow: options.shallow,
			});
		});
		return [search, null];
	} catch (err) {
		// NOTE(joel): Handle possible errors due to rate-limiting of history
		// methods in browsers.
		console.error(
			`URL update rate-limited by the browser. Consider increasing 'throttleMs' for key(s) '${items.map(([key]) => key).join()}'. ${err}`,
		);
		return [search, err];
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Composes a series of transition functions into a single function that
 * executes them in sequence. Each function is called with a callback that
 * triggers the next function in the sequence.
 */
function compose(fns: React.TransitionStartFunction[], final: () => void) {
	const recursiveCompose = (index: number) => {
		if (index === fns.length) return final();

		const fn = fns[index];
		if (!fn) {
			throw new Error('Invalid transition function');
		}

		// NOTE(joel): Ensure that each transition function is executed in order,
		// and each one receives a callback to continue the chain.
		fn(() => recursiveCompose(index + 1));
	};

	recursiveCompose(0);
}
