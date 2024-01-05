'use client';

import { Toaster } from './toaster';
import { Toast } from './toast';
import {
	ToastQueue as StatelyToastQueue,
	useToastQueue,
} from '@react-stately/toast';

import type { AriaToastRegionProps } from '@react-aria/toast';
import type { ToastOptions } from '@react-stately/toast';
import type { ToastValue } from './toast';

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): We use a single global toast queue instance for the whole app,
// initialized lazily.
let globalToastQueue: StatelyToastQueue<ToastValue> | null = null;
function getGlobalToastQueue() {
	if (globalToastQueue == null) {
		globalToastQueue = new StatelyToastQueue({
			maxVisibleToasts: 5,
			hasExitAnimation: true,
		});
	}
	return globalToastQueue;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Global `ToastQueue` object that can be used to add toasts to the
 * global queue outside of React.
 */
export const ToastQueue = {
	info(children: string, options: AddToastOptions = {}) {
		return addToast(children, 'info', options);
	},
	positive(children: string, options: AddToastOptions = {}) {
		return addToast(children, 'positive', options);
	},
	negative(children: string, options: AddToastOptions = {}) {
		return addToast(children, 'negative', options);
	},
};

////////////////////////////////////////////////////////////////////////////////

interface ToastContainerProps extends AriaToastRegionProps {}

/**
 * A ToastContainer renders the queued toasts in an application.
 * It should be placed at the root of the app.
 */
export function ToastContainer(props: ToastContainerProps) {
	let state = useToastQueue(getGlobalToastQueue());
	// if (ref === activeToastContainer && state.visibleToasts.length > 0) {
	if (state.visibleToasts.length > 0) {
		return (
			<Toaster state={state} {...props}>
				{state.visibleToasts.map(toast => (
					<Toast key={toast.key} toast={toast} state={state} />
				))}
			</Toaster>
		);
	}

	return null;
}

////////////////////////////////////////////////////////////////////////////////

interface AddToastOptions extends Omit<ToastOptions, 'priority'> {
	/** A label for the action button within the toast. */
	actionLabel?: string;
	/** Handler that is called when the action button is pressed. */
	onAction?: () => void;
	/** Whether the toast should automatically close when an action is performed. */
	shouldCloseOnAction?: boolean;
}

/**
 * Adds a toast to the global `ToastQueue`.
 */
function addToast(
	children: string,
	variant: ToastValue['variant'],
	options: AddToastOptions = {},
) {
	const queue = getGlobalToastQueue();

	const key = queue.add(
		{
			children,
			variant,
			actionLabel: options.actionLabel,
			onAction: options.onAction,
			shouldCloseOnAction: options.shouldCloseOnAction,
		},
		{
			priority: getPriority(variant, options),
			timeout: getTimeout(options),
			onClose: options.onClose,
		},
	);

	return () => queue.close(key);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Calculates the timeout for a toast based on the options.
 * Toasts must be visible at least 5s.
 * In addition, actionable toasts cannot be auto dismissed
 * @see https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html
 */
function getTimeout(options: AddToastOptions) {
	return options.timeout && !options.onAction
		? Math.max(options.timeout, 5000)
		: undefined;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Get the priority of a toast based on its variant and options.
 * If a toast has an action, it should be more important than positive toasts
 * without an action but less important than negative toasts.
 */
function getPriority(variant: ToastValue['variant'], options: AddToastOptions) {
	let priority = 1;
	switch (variant) {
		case 'negative': {
			priority = 5;
			break;
		}
		case 'positive': {
			priority = 2;
			break;
		}
		case 'info': {
			priority = 1;
			break;
		}
	}
	if (options.onAction != null) priority += 2;
	return priority;
}
