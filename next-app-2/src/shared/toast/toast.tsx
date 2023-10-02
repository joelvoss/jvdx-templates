import { forwardRef } from 'react';
import { Button } from 'react-aria-components';
import { useToast } from '@react-aria/toast';
import { useObjectRef } from '@/lib/use-object-ref';
import styles from './toast.module.css';

import type { QueuedToast, ToastState } from '@react-stately/toast';
import type { ForwardedRef } from 'react';

export interface ToastValue {
	children: string;
	variant: 'positive' | 'negative' | 'info';
	actionLabel?: string;
	onAction?: () => void;
	shouldCloseOnAction?: boolean;
}

interface ToastProps {
	toast: QueuedToast<ToastValue>;
	state: ToastState<ToastValue>;
}

function _Toast(props: ToastProps, ref: ForwardedRef<HTMLDivElement>) {
	let { toast, state } = props;
	const {
		key,
		animation,
		priority,
		content: { children, variant, actionLabel, onAction, shouldCloseOnAction },
	} = toast;

	let domRef = useObjectRef(ref);

	let { closeButtonProps, titleProps, toastProps } = useToast(
		props,
		state,
		domRef,
	);

	const handleAction = () => {
		if (onAction) onAction();
		if (shouldCloseOnAction) state.close(key);
	};

	return (
		<div
			{...toastProps}
			ref={domRef}
			className={styles.container}
			style={{ zIndex: priority }}
			data-variant={variant}
			data-animation={animation}
			onAnimationEnd={() => {
				if (animation === 'exiting') state.remove(key);
			}}
		>
			<svg className={styles.icon}>
				{variant === 'negative' ? <use xlinkHref="#error" /> : null}
				{variant === 'positive' ? <use xlinkHref="#check-circle" /> : null}
				{variant === 'info' ? <use xlinkHref="#notification" /> : null}
			</svg>

			<div className={styles.body}>
				<div className={styles.content} {...titleProps}>
					{children}
				</div>
				{actionLabel && (
					<Button onPress={handleAction} className={styles.button}>
						{actionLabel}
					</Button>
				)}
			</div>

			<div className={styles.buttonContainer}>
				<Button className={styles.closeButton} {...closeButtonProps}>
					<svg>
						<use xlinkHref="#close" />
					</svg>
				</Button>
			</div>
		</div>
	);
}

export const Toast = forwardRef(_Toast);
