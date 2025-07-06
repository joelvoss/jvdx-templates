'use client';

import { usePathname } from 'next/navigation';
import { Suspense, useCallback, useEffect, useSyncExternalStore } from 'react';
import { getGlobalProgress } from '.';

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
	const pathname = usePathname();

	return (
		<>
			{value != null ? (
				<div className='fixed top-0 left-0 w-full h-1 z-50 bg-transparent'>
					<div
						className='w-full h-full transition-transform duration-200 ease-out bg-blue-700 shadow-xl'
						style={{ transform: `translateX(-${(1 - value) * 100}%)` }}
					/>
				</div>
			) : null}
			<Suspense fallback={null}>
				<ProgressDone key={pathname} />
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
	const progress = getGlobalProgress();
	useEffect(() => progress.done(), [progress]);
	return null;
}
