import '@/globals.css';
import type { Metadata } from 'next';
import { useI18n } from '@/lib/i18n/server';
import { getLocale } from '@/lib/locale/server';
import { QueryStateProvider } from '@/lib/query-state/context';
import { LanguageMenu } from '@/shared/language-menu';
import { Link } from '@/shared/link';
import { ProgressBar } from '@/shared/progress/bar';
import { SvgSprite } from '@/shared/svg-sprite';
import { ToastRegion } from '@/shared/toast';

////////////////////////////////////////////////////////////////////////////////

/**
 * generateMetadata returns metadata for the app, including title, description,
 * and icons.
 */
export async function generateMetadata(): Promise<Metadata> {
	const title = 'template-next-app';
	const description = 'template-next-app';
	const url = 'https://github.com/joelvoss/jvdx-core';

	return {
		title: { default: `Home | ${title}`, template: `%s | ${title}` },
		description,
		authors: [{ name: 'Joel Voß <mail@joelvoss.com>', url }],
		icons: [
			{ rel: 'icon', url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
		],
	};
}

////////////////////////////////////////////////////////////////////////////////

type RootLayoutProps = {
	children?: React.ReactNode;
};

/**
 * RootLayout defines the root layout structure for all pages, including
 * header, footer, and global providers.
 */
export default async function RootLayout(props: RootLayoutProps) {
	const { children } = props;

	const lang = await getLocale();
	const t = await useI18n();

	return (
		<html lang={lang}>
			<body>
				<QueryStateProvider>
					<header className='bg-gray-100 p-4'>
						<div className='mx-auto flex max-w-7xl items-center justify-between px-4'>
							<nav className='flex items-center space-x-2'>
								<Link href='/' title={t('global.app-title')}>
									<img className='size-8' src='/logo.svg' alt='' />
								</Link>
								<Link
									className='rounded-sm px-4 py-2 font-medium text-neutral-900 hover:bg-gray-200 data-active:bg-gray-200'
									href='/'
								>
									{t('global.nav.home')}
								</Link>
								<Link
									className='rounded-sm px-4 py-2 font-medium text-neutral-900 hover:bg-gray-200 data-active:bg-gray-200'
									href='/books'
								>
									{t('global.nav.books')}
								</Link>
							</nav>
							<LanguageMenu />
						</div>
					</header>
					<main className='mx-auto max-w-7xl flex-auto px-4'>{children}</main>
					<ProgressBar />
					<ToastRegion />
					<SvgSprite />
				</QueryStateProvider>
			</body>
		</html>
	);
}
