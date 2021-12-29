import Link from 'next/link';
import { getLayout as getSiteLayout } from '@/layouts/site';
import { Meta } from '@/shared/meta';
import { useI18n } from '@/hooks/use-i18n';
import * as styles from './styles.module.css';

/**
 * Pre-rendered 500 page
 * @see https://nextjs.org/docs/advanced-features/custom-error-page
 */
export default function ServerErrorPage() {
	const t = useI18n(s => s.translate);

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

ServerErrorPage.getLayout = getSiteLayout;
