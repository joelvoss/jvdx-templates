import Head from 'next/head';

const fallback = {
	title: 'template-next-app',
	description: 'Next.js Template Application',
	keywords: '@jvdx/core, Next.js, Template',
	image: '/android-chrome-512x512.png',
	url: 'https://github.com/joelvoss/jvdx-core',
	author: 'Joel Voss',
};

export function Meta(props) {
	const content = { ...fallback, ...props };

	return (
		<Head>
			<meta charSet="utf-8" />
			<meta name="viewport" content="width=device-width" />

			{/* Favicon */}
			<link
				rel="apple-touch-icon"
				sizes="180x180"
				href="/apple-touch-icon.png"
			/>
			<link
				rel="icon"
				type="image/png"
				sizes="32x32"
				href="/favicon-32x32.png"
			/>
			<link
				rel="icon"
				type="image/png"
				sizes="16x16"
				href="/favicon-16x16.png"
			/>
			<link rel="manifest" href="/site.webmanifest" />
			<meta name="theme-color" content="#555" />

			{/* Twitter */}
			<meta name="twitter:title" content={content.title} />
			<meta name="twitter:description" content={content.description} />
			<meta name="twitter:image" content={content.image} />

			{/* Facebook */}
			<meta property="og:title" content={content.title} />
			<meta property="og:description" content={content.description} />
			<meta property="og:image" content={content.image} />
			<meta property="og:url" content={content.url} />

			<title>{content.title}</title>
			<meta name="description" content={content.description} />
			<meta name="keywords" content={content.keywords} />
			<meta name="author" content={content.author} />
		</Head>
	);
}
