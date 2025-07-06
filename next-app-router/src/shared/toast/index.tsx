'use client';

import {
	Button,
	type QueuedToast,
	UNSTABLE_Toast as RACToast,
	UNSTABLE_ToastRegion as RACToastRegion,
	Text,
	UNSTABLE_ToastContent as ToastContent,
	UNSTABLE_ToastList as ToastList,
	type ToastProps,
	UNSTABLE_ToastQueue as ToastQueue,
} from 'react-aria-components';
import { flushSync } from 'react-dom';

////////////////////////////////////////////////////////////////////////////////

type ToastType = {
	title: string;
	description?: string;
};

/**
 * A toast queue that manages the state of toasts. It wraps state updates in a
 * CSS view transition for smooth animations.
 * The state is stored outside React so that we can trigger toasts from
 * anywhere in our application, not just inside components.
 */
export const queue = new ToastQueue<ToastType>({
	// NOTE(joel): Wrap state updates in a CSS view transition.
	wrapUpdate(fn) {
		if ('startViewTransition' in document) {
			document.startViewTransition(() => {
				flushSync(fn);
			});
		} else {
			fn();
		}
	},
});

////////////////////////////////////////////////////////////////////////////////

/**
 * A toast region that wraps the toast list and provides a queue for managing
 * toasts. It is used to display the toasts in the UI.
 */
export function ToastRegion() {
	return (
		<RACToastRegion
			className='pointer-events-none fixed bottom-4 flex w-full justify-center outline-none'
			queue={queue}
		>
			<ToastList className='m-0 flex list-none flex-col-reverse gap-2 p-0 outline-none'>
				{({ toast }: { toast: QueuedToast<ToastType> }) => (
					<Toast toast={toast} />
				)}
			</ToastList>
		</RACToastRegion>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * A toast component that displays a single toast. It is used inside the
 * toast list to render each toast.
 */
export function Toast(props: ToastProps<ToastType>) {
	const { toast, ...otherProps } = props;
	return (
		<RACToast
			className='pointer-events-auto flex items-center gap-4 bg-white px-4 py-3 text-gray-900 shadow-lg border border-gray-100 outline-none'
			style={{ viewTransitionName: toast.key }}
			toast={toast}
			{...otherProps}
		>
			<ToastContent className='flex w-md flex-1 flex-col'>
				<Text className='font-semibold' slot='title'>
					{toast.content.title}
				</Text>
				<Text className='text-sm italic' slot='description'>
					{toast.content.description}
				</Text>
			</ToastContent>
			<Button
				className='flex h-8 w-8 flex-shrink-0 cursor-pointer appearance-none items-center justify-center rounded-full border-2 border-gray-900 bg-transparent p-0 text-base transition-all duration-100 ease-out outline-none hover:border-gray-400 hover:text-gray-400'
				slot='close'
			>
				<svg className='w-4 h-4'>
					<use href='#close' />
				</svg>
			</Button>
		</RACToast>
	);
}
