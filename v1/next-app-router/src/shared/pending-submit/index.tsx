'use client';

import { useFormStatus } from 'react-dom';
import { Button } from 'react-aria-components';
import { mergeProps } from '@/lib/merge-props';
import styles from './index.module.css';

import type { ButtonProps } from 'react-aria-components';

interface PendingSubmitProps extends ButtonProps {}

export function PendingSubmit(props: PendingSubmitProps) {
	const { pending } = useFormStatus();
	const { children, ...rest } = props;

	const buttonProps = mergeProps(
		rest,
		{ type: 'submit' },
		pending ? { isDisabled: true, className: styles.pending } : null,
	);

	return (
		<Button {...buttonProps}>
			{pending ? (
				<>
					<svg className={styles.svg}>
						<use xlinkHref="#loading" />
					</svg>
					{children}
				</>
			) : (
				children
			)}
		</Button>
	);
}
