import Link from 'next/link';
import { Meta } from '@/shared/meta';
import { useI18n } from '@/hooks/use-i18n';
import { isNonNull } from '@/lib/assertions';
import styles from './_error.module.css';

import type { NextPageContext } from 'next';

type ErrorProps = {
	statusCode?: number;
};

////////////////////////////////////////////////////////////////////////////////

/**
 * 404 or 500 error page used on client side transitions.
 * @see https://nextjs.org/docs/advanced-features/custom-error-page
 */
export default function Error(props: ErrorProps) {
	const { statusCode } = props;
	const isFatalError = !isNonNull(statusCode) || statusCode !== 404;
	const t = useI18n(s => s.translate);

	if (isFatalError) {
		return (
			<>
				<Meta title={t('500.title')} />

				<section className={styles.section}>
					<div className={styles.container}>
						<h1 className={styles.heading}>{t('500.heading')}</h1>
						<p className={styles.body}>{t('500.description')}</p>
						<Link href="/" passHref>
							<a className={styles.link}>{t('500.link')}</a>
						</Link>
					</div>
				</section>
			</>
		);
	}

	return (
		<>
			<Meta title={t('404.title')} />

			<section className={styles.section}>
				<div className={styles.container}>
					<h1 className={styles.heading}>{t('404.heading')}</h1>
					<p className={styles.body}>{t('404.description')}</p>
					<Link href="/" passHref>
						<a className={styles.link}>{t('404.link')}</a>
					</Link>
				</div>
			</section>
		</>
	);
}

Error.getInitialProps = (ctx: NextPageContext) => {
	const { res, err } = ctx;
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
	return { statusCode };
};
