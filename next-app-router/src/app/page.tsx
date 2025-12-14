import { Github } from '@/db/github';
import { useI18n } from '@/lib/i18n/server';

////////////////////////////////////////////////////////////////////////////////

/**
 * HomePage is the main landing page of the app.
 */
export default async function HomePage() {
	const t = await useI18n();

	return (
		<section>
			<CodeBlock />
			<p className='mt-4'>{t('home.desc')}</p>
		</section>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * CodeBlock fetches and displays repository data as formatted JSON.
 */
async function CodeBlock() {
	const data = await Github.getRepo('joelvoss/jvdx-core');

	return (
		<code className='text-normal-700 mt-4 block rounded-md bg-gray-100 p-4 text-sm md:text-base'>
			<pre className='m-0 whitespace-pre-wrap'>
				{JSON.stringify(data, null, 2)}
			</pre>
		</code>
	);
}
