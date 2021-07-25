import { createContext, useContext, useEffect, useState } from 'react';
import { error } from '@/lib/logger';
import { getCsrf } from '@/lib/get-csrf';

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
		(async () => {
			if (csrf.token == null) {
				if (defaultCsrf != null) {
					setCsrf(defaultCsrf);
					return;
				}

				try {
					const newCsrf = await getCsrf();
					setCsrf(newCsrf);
				} catch (err) {
					error(`CLIENT_FETCH_CSRF_ERROR`, err);
				}
			}
		})();
	}, [csrf.token, defaultCsrf, setCsrf]);

	return csrf;
}
