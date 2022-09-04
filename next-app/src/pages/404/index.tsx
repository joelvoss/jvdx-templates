import Link from 'next/link';
import { getLayout as getSiteLayout } from '@/layouts/site';
import { Meta } from '@/shared/meta';
import { useI18n } from '@/hooks/use-i18n';
import styles from './styles.module.css';

/**
 * Pre-rendered 404 page
 * @see https://nextjs.org/docs/advanced-features/custom-error-page
 */
export default function NotFoundPage() {
	const { t } = useI18n();

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

NotFoundPage.getLayout = getSiteLayout;
