import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToastRegion } from '@react-aria/toast';
import styles from './toaster.module.css';

import type { ReactNode } from 'react';
import type { AriaToastRegionProps } from '@react-aria/toast';
import type { ToastState } from '@react-stately/toast';

////////////////////////////////////////////////////////////////////////////////

interface ToasterProps extends AriaToastRegionProps {
	children: ReactNode;
	state: ToastState<unknown>;
}

/**
 * A Toaster renders a navigatable landmark containing toasts.
 * Landmarks provide a way to designate important subsections of a page. They
 * allow screen reader users to get an overview of the various sections of the
 * page, and jump to a specific section using `F6` or `Shift+F6`.
 */
export function Toaster(props: ToasterProps) {
	let { children, state } = props;

	const ref = useRef(null);
	const { regionProps } = useToastRegion(props, state, ref);

	const contents = (
		<div
			{...regionProps}
			ref={ref}
			className={styles.container}
			data-position="bottom"
			data-placement="right"
		>
			{children}
		</div>
	);

	return createPortal(contents, document.body);
}
