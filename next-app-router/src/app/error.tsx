// NOTE(joel): Error components must be Client Components
'use client';

import { useEffect } from 'react';
import { log } from '@/lib/logger';
import { getI18n } from '@/lib/i18n';
import { useLocale } from '@/lib/locale/client';
import styles from './error.module.css';

type ErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function Error(props: ErrorProps) {
	const { error } = props;

	const lang = useLocale();
	const t = getI18n(lang);

	// NOTE(joel): Log the error to an error reporting service
	useEffect(() => {
		log.error(error.message);
	}, [error]);

	return (
		<section className={styles.section}>
			<div className={styles.container}>
				<h1 className={styles.heading}>{t('500.heading')}</h1>
				<p className={styles.body}>{t('500.description')}</p>
				<a href="/" className={styles.link}>
					{t('500.link')}
				</a>
			</div>
		</section>
	);
}
