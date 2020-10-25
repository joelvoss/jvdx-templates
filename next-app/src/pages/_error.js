import * as React from 'react';
import Head from 'next/head';

export default function Error({ statusCode }) {
	return (
		<div className="bg-white">
			<Head>
				<title>{statusCode}</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="lg:text-center">
					<h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
						{statusCode
							? `An error ${statusCode} occurred on server`
							: 'An error occurred on client'}
					</h1>
				</div>
			</main>
		</div>
	);
}

Error.getInitialProps = ({ res, err }) => {
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
	return { statusCode };
};
