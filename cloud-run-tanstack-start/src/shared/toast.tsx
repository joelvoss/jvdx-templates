import { CSSProperties } from "react";
import {
	UNSTABLE_ToastRegion as RACToastRegion,
	UNSTABLE_Toast as RACToast,
	UNSTABLE_ToastQueue as RACToastQueue,
	UNSTABLE_ToastContent as RACToastContent,
	type ToastProps,
	Button as RACButton,
	Text as RACText,
	composeRenderProps,
} from "react-aria-components";
import { flushSync } from "react-dom";

import { clsx } from "~/lib/clsx";

////////////////////////////////////////////////////////////////////////////////

export interface TContent {
	title: string;
	description?: string;
}

/**
 * A queue to manage toasts throughout the application.
 * You can add toasts to this queue from anywhere in your app.
 */
export const toastQueue = new RACToastQueue<TContent>({
	// Wrap state updates in a CSS view transition.
	wrapUpdate(fn) {
		if ("startViewTransition" in document) {
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
 * Toast Region Component.
 * Renders the toast region that displays toasts from the queue.
 */
export function ToastRegion() {
	return (
		<RACToastRegion
			queue={toastQueue}
			className="fixed right-4 bottom-4 flex flex-col-reverse gap-2 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 focus-visible:outline-solid"
		>
			{({ toast }) => (
				<Toast toast={toast}>
					<RACToastContent className="flex min-w-0 flex-1 flex-col">
						<RACText slot="title" className="font-semibold text-white text-sm">
							{toast.content.title}
						</RACText>
						{toast.content.description && (
							<RACText slot="description" className="text-xs text-white">
								{toast.content.description}
							</RACText>
						)}
					</RACToastContent>
					<RACButton
						slot="close"
						aria-label="Close"
						className="flex h-8 w-8 flex-none cursor-pointer appearance-none items-center justify-center rounded-sm border-none bg-transparent p-0 text-white outline-none [-webkit-tap-highlight-color:transparent] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid pressed:bg-white/15"
					>
						<svg className="w-4 h-4">
							<use href="#close" />
						</svg>
					</RACButton>
				</Toast>
			)}
		</RACToastRegion>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Custom Toast Component.
 * Styles the individual toast notifications.
 */
function Toast(props: ToastProps<TContent>) {
	const { className, ...rest } = props;

	return (
		<RACToast
			{...rest}
			style={{ viewTransitionName: props.toast.key } as CSSProperties}
			className={composeTailwindRenderProps(
				className,
				"flex w-75 items-center gap-4 rounded-lg bg-sky-600 px-4 py-3 font-sans outline-none [view-transition-class:toast] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 focus-visible:outline-solid forced-colors:outline",
			)}
		/>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Utility function to compose Tailwind CSS classes with optional dynamic
 * class names.
 */
function composeTailwindRenderProps<T>(
	className: string | ((v: T) => string) | undefined,
	tw: string,
): string | ((v: T) => string) {
	return composeRenderProps(className, (className) => clsx(tw, className));
}
