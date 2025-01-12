'use client';

import { useFormStatus } from 'react-dom';
import { mergeProps } from '@/lib/merge-props';
import styles from './index.module.css';

import type { ComponentProps } from 'react';

interface PendingSubmitProps extends ComponentProps<'button'> {}

export function PendingSubmit(props: PendingSubmitProps) {
	const { pending } = useFormStatus();
	const { children, ...rest } = props;

	const buttonProps = mergeProps(
		rest,
		{ type: 'submit' },
		pending ? { disabled: true, className: styles.pending } : null,
	);

	return (
		// NOTE(joel): We cant use React Arias <Button> here, since there is a
		// bug in the current `useFormStatus` implementation that prevents us from
		// using it with. See https://github.com/facebook/react/issues/30368
		<button {...buttonProps}>
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
		</button>
	);
}
