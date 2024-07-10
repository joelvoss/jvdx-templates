import React, { createContext, useContext, useEffect, useState } from 'react';
import { memoize } from 'memoize-lit';
import { request } from 'request-lit';
import { isEqual, isNonNull } from '@/lib/assertions';
import { error } from '@/lib/logger';
import { getHost } from '@/lib/get-host';

import type { Dispatch, SetStateAction } from 'react';

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): Memoize the `request.get` function for one second to dedupe
// parallel requests and act as a simple "cache" for serial requests happening
// within this timeframe.
const makeRequest = memoize(request.get, { maxAge: 1000, isEqual });

////////////////////////////////////////////////////////////////////////////////

type CsrfValueState = {
	token?: string;
	isLoading: boolean;
};

export const CsrfValueContext = createContext<CsrfValueState>({
	isLoading: true,
});
export const CsrfSetterContext = createContext<
	Dispatch<SetStateAction<string | undefined>> | undefined
>(undefined);

////////////////////////////////////////////////////////////////////////////////

type CSRFProviderProps = {
	csrf?: string;
	children?: React.ReactNode;
};

/**
 * CSRF provider that surfaces CSRF tokens for the whole app.
 */
export function CsrfProvider(props: CSRFProviderProps) {
	const { children, csrf: defaultCsrf } = props;
	const [token, tokenSet] = useState(defaultCsrf);
	return (
		<CsrfSetterContext.Provider value={tokenSet}>
			<CsrfValueContext.Provider
				value={{ token, isLoading: Boolean(token == null) }}
			>
				{children}
			</CsrfValueContext.Provider>
		</CsrfSetterContext.Provider>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * useCsrf returns the current csrf token either from context or fetches
 * a new one for us.
 */
export function useCsrf(defaultCsrf?: string) {
	const csrf = useContext(CsrfValueContext);
	const setCsrf = useContext(CsrfSetterContext);

	if (!isNonNull(csrf) || !isNonNull(setCsrf)) {
		throw new TypeError(
			`No context found. Please wrap components using 'useCsrf' in a '<CsrfProvider>'.`,
		);
	}

	useEffect(() => {
		if (!isNonNull(csrf.token)) {
			fetchToken();
		}

		async function fetchToken() {
			// NOTE(joel): TS cannot assert that `setCsrf` is not null even though
			// we type guard it outside the `useEffect` hook.
			if (!isNonNull(setCsrf)) return;

			if (isNonNull(defaultCsrf)) {
				setCsrf(defaultCsrf);
				return;
			}

			try {
				const { origin } = getHost();
				const res = await makeRequest(`${origin}/api/csrf`);
				const { token: newCsrf } = await res.json();
				setCsrf(newCsrf);
			} catch (err) {
				error(`CLIENT_FETCH_CSRF_ERROR`, err);
			}
		}
	}, [csrf.token, defaultCsrf, setCsrf]);

	return csrf;
}
