import { createContext, useContext, useEffect, useState } from 'react';
import { memoize } from 'memoize-lit';
import { request } from 'request-lit';
import { isEqual } from '@/lib/is-equal';
import { error } from '@/lib/logger';
import { getHost } from '@/lib/get-host';

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): Memoize the `request.get` function for one second to dedupe
// parallel requests and act as a simple "cache" for serial requests happening
// within this timeframe.
const makeRequest = memoize(request.get, { maxAge: 1000, isEqual });

////////////////////////////////////////////////////////////////////////////////

// Context to store session data globally
export const CsrfValueContext = createContext();
export const CsrfSetterContext = createContext();

////////////////////////////////////////////////////////////////////////////////

/**
 * CSRF provider that surfaces CSRF tokens for the whole app.
 * @param {{ children: JSX.Element|JSX.Element[], csrf: string }}
 */
export function CsrfProvider({ children, csrf: defaultCsrf }) {
	const [csrf, setCsrf] = useState(defaultCsrf);
	return (
		<CsrfSetterContext.Provider value={setCsrf}>
			<CsrfValueContext.Provider
				value={{ csrf, isLoading: Boolean(csrf == null) }}
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
 * @returns {{ csrf: string, isLoading: boolean }|null}
 */
export function useCsrf(defaultCsrf) {
	const csrf = useContext(CsrfValueContext);
	const setCsrf = useContext(CsrfSetterContext);

	useEffect(() => {
		if (csrf.token == null) {
			fetchToken();
		}

		async function fetchToken() {
			if (defaultCsrf != null) {
				setCsrf(defaultCsrf);
				return;
			}

			try {
				const { origin } = getHost();
				const { data } = await makeRequest('/api/csrf', { baseURL: origin });
				const newCsrf = data?.token;
				setCsrf(newCsrf);
			} catch (err) {
				error(`CLIENT_FETCH_CSRF_ERROR`, err);
			}
		}
	}, [csrf.token, defaultCsrf, setCsrf]);

	return csrf;
}
