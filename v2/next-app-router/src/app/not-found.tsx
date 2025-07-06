import { useI18n } from '@/lib/i18n/server';
import { getLocale } from '@/lib/locale/server';

////////////////////////////////////////////////////////////////////////////////

/**
 * NotFound renders a custom 404 page when a route is not found.
 */
export default async function NotFound() {
	const lang = await getLocale();
	const t = useI18n(lang);

	return (
		<section className='mt-8 flex items-center justify-center'>
			<div className='text-center'>
				<h1 className='m-0 text-center font-bold'>{t('404.heading')}</h1>
				<p className='mt-4 max-w-prose'>{t('404.description')}</p>
				<a
					href='/'
					className='mt-4 inline-block rounded-md bg-gray-100 px-4 py-2 text-neutral-900 hover:bg-gray-200'
				>
					{t('404.link')}
				</a>
			</div>
		</section>
	);
}
