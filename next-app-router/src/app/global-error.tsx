// NOTE(joel): Error components must be Client Components
'use client';

import '@/globals.css';
import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n/client';
import { useLocale } from '@/lib/locale/client';
import { log } from '@/lib/logger';
import { QueryStateProvider } from '@/lib/query-state/context';
import { Link } from '@/shared/link';
import { ProgressBar } from '@/shared/progress/bar';
import { SvgSprite } from '@/shared/svg-sprite';
import { ToastRegion } from '@/shared/toast';
import { LanguageMenu } from '../shared/language-menu';

////////////////////////////////////////////////////////////////////////////////

interface GlobalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * GlobalError is the top-level error boundary for the app. It displays a
 * user-friendly error page when an uncaught error occurs, and logs the error
 * for reporting.
 */
export default function GlobalError(props: GlobalErrorProps) {
	const { error } = props;

	const lang = useLocale();
	const t = useI18n(lang);

	// NOTE(joel): Log the error to an error reporting service
	useEffect(() => {
		log.error(error.message);
	}, [error]);

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
					<main className='mx-auto max-w-7xl flex-auto px-4'>
						<section className='mt-8 flex items-center justify-center'>
							<div className='text-center'>
								<h1 className='m-0 text-center font-bold'>
									{t('500.heading')}
								</h1>
								<p className='mt-4 max-w-prose'>{t('500.description')}</p>
								<a
									href='/'
									className='mt-4 inline-block rounded-md bg-gray-100 px-4 py-2 text-neutral-900 hover:bg-gray-200'
								>
									{t('500.link')}
								</a>
							</div>
						</section>
					</main>
					<ProgressBar />
					<ToastRegion />
					<SvgSprite />
				</QueryStateProvider>
			</body>
		</html>
	);
}
