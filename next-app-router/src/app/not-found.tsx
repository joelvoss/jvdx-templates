import { getI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/locale/server';
import styles from './not-found.module.css';

export default function NotFound() {
	const lang = getLocale();
	const t = getI18n(lang);

	return (
		<section className={styles.section}>
			<div className={styles.container}>
				<h1 className={styles.heading}>{t('404.heading')}</h1>
				<p className={styles.body}>{t('404.description')}</p>
				<a href="/" className={styles.link}>
					{t('404.link')}
				</a>
			</div>
		</section>
	);
}
