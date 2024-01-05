import 'client-only';

import { CSRF_HEAD_NAME } from '@/constants';

////////////////////////////////////////////////////////////////////////////////

/**
 * Get the CSRF token from a meta tag in the DOM.
 * Corresponds to `generateMetadata()` in `src/app/layout.tsx`.
 */
export function useCsrfToken() {
	if (typeof document === 'undefined') return '';
	const meta = document.querySelector(`meta[name="${CSRF_HEAD_NAME}"]`);
	const token = meta?.getAttribute('content') || '';
	return token;
}
