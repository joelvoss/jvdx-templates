import * as React from 'react';
import { Meta } from '@/shared/meta';
import { getLayout as getSiteLayout } from '@/layouts/site';
import * as styles from './index.module.css';

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
	return (
		<section>
			<Meta title={data.pkgName} />

			<code className={styles.code}>
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</code>

			<span className={styles.spacer} />

			<p className={styles.p}>
				<strong>Explanation:</strong> This page is statically generated with
				Next.js by fetching data from GitHub.
			</p>
			<p className={styles.p}>
				Importantly, this page is being re-generated using{' '}
				<a
					href="https://nextjs.org/docs/basic-features/data-fetching#incremental-static-regeneration"
					className={styles.a}
				>
					Incremental Static Regeneration
				</a>
				.
			</p>
		</section>
	);
}

HomePage.getLayout = getSiteLayout;
