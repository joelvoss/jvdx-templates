import { Link } from '@/shared/link';
import { SvgSprite } from '@/shared/svg-sprite';
import { ToastContainer } from '@/shared/toast';
import { ProgressBar } from '@/shared/progress/bar';
import { LanguageMenu } from './_components/language-menu';
import { getI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/locale/server';
import { getCsrfToken } from '@/lib/csrf/server';
import { CSRF_HEAD_NAME } from '@/constants';
import styles from './layout.module.css';

import type { Metadata } from 'next';

import '@/globals.css';

////////////////////////////////////////////////////////////////////////////////

export async function generateMetadata(): Promise<Metadata> {
	const title = 'template-next-app';
	const description = 'template-next-app';
	const url = 'https://github.com/joelvoss/jvdx-core';

	return {
		title: {
			default: `Home | ${title}`,
			template: `%s | ${title}`,
		},
		description,
		keywords: ['@jvdx/core, Next.js, Template'],
		authors: [{ name: 'Joel Voss', url }],
		icons: [
			{ rel: 'icon', url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
			{ rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16' },
			{ rel: 'icon', url: '/favicon-32x32.png', sizes: '32x32' },
			{ rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
		],
		manifest: '/site.webmanifest',
		metadataBase: new URL('https://localhost:3000'),
		twitter: {
			title,
			description,
			images: '/android-chrome-512x512.png',
		},
		openGraph: {
			title,
			description,
			images: '/android-chrome-512x512.png',
		},
		other: {
			[CSRF_HEAD_NAME]: getCsrfToken(),
		},
	};
}

////////////////////////////////////////////////////////////////////////////////

type RootLayoutProps = {
	children?: React.ReactNode;
};

export default async function RootLayout(props: RootLayoutProps) {
	const { children } = props;

	const lang = getLocale();
	const t = getI18n(lang);

	return (
		<html lang={lang}>
			<body>
				<header className={styles.header}>
					<div className={styles.headerInner}>
						<nav className={styles.nav}>
							<Link href="/" title={t('global.app-title')}>
								<img className={styles.logo} src="/logo.svg" alt="" />
							</Link>
							<Link className={styles.navLink} href="/">
								{t('global.nav.home')}
							</Link>
							<Link className={styles.navLink} href="/mutate">
								{t('global.nav.mutate')}
							</Link>
						</nav>

						<LanguageMenu />
					</div>
				</header>
				<main className={styles.main}>{children}</main>
				<ProgressBar />
				<ToastContainer />
				<SvgSprite />
			</body>
		</html>
	);
}
