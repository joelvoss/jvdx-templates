import { getI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/locale/server';
import { Github } from '@/db/github';
import styles from './page.module.css';

////////////////////////////////////////////////////////////////////////////////

export default async function HomePage() {
	const lang = getLocale();
	const t = getI18n(lang);

	const data = await Github.getRepo('joelvoss/jvdx-core');

	return (
		<section>
			<code className={styles.code}>
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</code>
			<p>{t('home.desc')}</p>
		</section>
	);
}
