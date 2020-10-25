import * as React from 'react';
import Head from 'next/head';

////////////////////////////////////////////////////////////////////////////////

export async function getStaticProps() {
	const { name } = require('../../package.json');

	const res = await fetch('https://api.github.com/users/joelvoss');
	const json = await res.json();

	if (res.status !== 200) {
		console.error(json);
		throw new Error('Failed to fetch API');
	}

	return {
		props: {
			data: { ...json, pkgName: name },
		},
		revalidate: 1,
	};
}

////////////////////////////////////////////////////////////////////////////////

export default function HomePage({ data }) {
	return (
		<div className="bg-white">
			<Head>
				<title>{data.pkgName}</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="lg:text-center">
					<h3 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
						{data.pkgName}
					</h3>
					<p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
						Userdata on <a href={data.html_url}>{data.html_url}</a>:
					</p>
				</div>

				<code className="block m-4 p-4 rounded text-xs bg-gray-100">
					<pre>{JSON.stringify(data, null, 2)}</pre>
				</code>

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
		</div>
	);
}
