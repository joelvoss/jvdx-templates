import Head from 'next/head';
import * as React from 'react';

export default function Custom404() {
	return (
		<div className="bg-white">
			<Head>
				<title>404</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="lg:text-center">
					<h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
						404 - Page Not Found
					</h1>
				</div>
			</main>
		</div>
	);
}
