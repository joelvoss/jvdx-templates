'use client';

import { Suspense, useCallback, useEffect, useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getGlobalProgress } from '.';
import styles from './bar.module.css';

////////////////////////////////////////////////////////////////////////////////

/**
 * Subscribes to a provided progress instance returns the current progress
 * value.
 */
export function useProgress() {
	const progress = getGlobalProgress();
	const subscribe = useCallback(
		(fn: () => void) => progress.subscribe(fn),
		[progress],
	);
	const getSnapshot = useCallback(() => progress.value, [progress]);
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * A progress bar that automatically updates when the progress instance
 * changes.
 */
export function ProgressBar() {
	const value = useProgress();
	return (
		<>
			{value != null ? (
				<div className={styles.container}>
					<div
						className={styles.inner}
						style={{ transform: `translateX(-${(1 - value) * 100}%)` }}
					/>
				</div>
			) : null}
			<Suspense fallback={null}>
				<ProgressDone />
			</Suspense>
		</>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Component that automatically calls `progress.done()` when the component is
 * mounted. Has to be wrapped in a `<Suspense>` component.
 */
function ProgressDone() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const progress = getGlobalProgress();
	useEffect(() => progress.done(), [pathname, progress, searchParams]);
	return null;
}
