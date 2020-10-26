import * as React from 'react';
import { Meta } from '../shared/meta';

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

export default function HomePage({ data }) {
	return (
		<>
			<Meta title={data.pkgName} />

			<main className="max-w-screen-xl mx-auto px-4">
				<span className="block my-2" />

				<h3 className="text-center text-3xl font-bold text-gray-900">
					{data.pkgName}
				</h3>

				<span className="block my-2" />

				<code className="block bg-gray-100 p-4 rounded text-xs">
					<pre>{JSON.stringify(data, null, 2)}</pre>
				</code>

				<span className="block my-2" />

				<p className="text-center">
					<strong>Explanation:</strong> This page is statically generated with
					Next.js by fetching data from GitHub.
				</p>
				<p className="text-center">
					Importantly, this page is being re-generated using{' '}
					<a
						href="https://nextjs.org/docs/basic-features/data-fetching#incremental-static-regeneration"
						className="underline hover:text-gray-500 transition duration-75 ease-in-out"
					>
						Incremental Static Regeneration
					</a>
					.
				</p>
			</main>
		</>
	);
}
