import * as React from 'react';
import { Meta } from '@/shared/meta';
import { getLayout as getSiteLayout } from '@/layouts/site';
import { useI18n } from '@/hooks/use-i18n';
import styles from './index.module.css';

////////////////////////////////////////////////////////////////////////////////

export async function getStaticProps() {
	const { name } = require('../../package.json');

	const res = await fetch('https://api.github.com/repos/joelvoss/jvdx-core');
	const json = await res.json();

	if (res.status !== 200) {
		console.error(json);
		throw new Error('Failed to fetch API');
	}

	return {
		props: {
			data: {
				name: json.name,
				url: json.html_url,
				description: json.description,
				stargazers_count: json.stargazers_count,
				watchers_count: json.watchers_count,
				pkgName: name,
			},
		},
		revalidate: 1,
	};
}

////////////////////////////////////////////////////////////////////////////////

export default function HomePage({ data = {} }) {
	const t = useI18n(s => s.translate);

	return (
		<section>
			<Meta title={t(`home.title`)} />

			<code className={styles.code}>
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</code>

			<span className={styles.spacer} />

			<p className={styles.p}>
				<strong>{t(`home.desc.0`)}</strong> {t(`home.desc.1`)}
			</p>
			<p className={styles.p}>
				{t(`home.desc.2`)}{' '}
				<a
					href="https://nextjs.org/docs/basic-features/data-fetching#incremental-static-regeneration"
					className={styles.a}
				>
					{t(`home.desc.3`)}
				</a>
			</p>
		</section>
	);
}

HomePage.getLayout = getSiteLayout;
