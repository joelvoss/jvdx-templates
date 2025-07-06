'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
	createContext,
	type PropsWithChildren,
	startTransition,
	useCallback,
	useContext,
	useOptimistic,
} from 'react';
import { renderQueryString } from './url-encoding';

////////////////////////////////////////////////////////////////////////////////

export type Options = {
	history?: 'replace' | 'push';
	scroll?: boolean;
	shallow?: boolean;
	throttleMs?: number;
	startTransition?: typeof startTransition;
	clearOnDefault?: boolean;
};

export type AdapterOptions = Pick<Options, 'history' | 'scroll' | 'shallow'>;

type UpdateUrlFunction = (
	search: URLSearchParams,
	options: Required<AdapterOptions>,
) => void;

export interface AdapterInterface {
	searchParams: URLSearchParams;
	updateUrl: UpdateUrlFunction;
	getSearchParamsSnapshot?: () => URLSearchParams;
	rateLimitFactor?: number;
}

interface AdapterContext {
	useAdapter: () => AdapterInterface;
}

////////////////////////////////////////////////////////////////////////////////

const context = createContext<AdapterContext>(null);

////////////////////////////////////////////////////////////////////////////////

export function useQueryStateContext() {
	const ctx = useContext(context);
	if (!('useAdapter' in ctx)) {
		throw new Error('useAdapter must be used within a QueryStateProvider');
	}
	return ctx.useAdapter();
}

////////////////////////////////////////////////////////////////////////////////

export function QueryStateProvider(props: PropsWithChildren) {
	const { children, ...rest } = props;
	return (
		<context.Provider {...rest} value={{ useAdapter }}>
			{children}
		</context.Provider>
	);
}

////////////////////////////////////////////////////////////////////////////////

function useAdapter() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [optimisticSearchParams, setOptimisticSearchParams] =
		useOptimistic<URLSearchParams>(searchParams);

	const updateUrl = useCallback(
		(search: URLSearchParams, options: Required<AdapterOptions>) => {
			startTransition(() => {
				if (!options.shallow) {
					setOptimisticSearchParams(search);
				}

				const hashlessBase =
					`${location.origin}${location.pathname}`.split('#')[0] ?? '';
				const queryString = renderQueryString(search);
				const url = hashlessBase + queryString + location.hash;

				// NOTE(joel): First, update the URL locally without triggering a
				// network request, this allows keeping a reactive URL if the network
				// is slow.
				const updateMethod =
					options.history === 'push' ? history.pushState : history.replaceState;
				updateMethod.call(
					history,
					// NOTE(joel): useSearchParams is reactive to shallow updates, but
					// only if passing `null` as the history state.
					null,
					'',
					url,
				);

				if (options.scroll) {
					window.scrollTo(0, 0);
				}

				if (!options.shallow) {
					// NOTE(joel): Call the Next.js router to perform a network request
					// and re-render server components.
					router.replace(url, { scroll: false });
				}
			});
		},
		[router.replace, setOptimisticSearchParams],
	);

	return {
		searchParams: optimisticSearchParams,
		updateUrl,
		rateLimitFactor: 3,
	};
}
