import { FileSystemDB } from '@/db/file-system-db';
import { getCsrfToken } from '@/lib/csrf/server';
import { Form } from './_components/form';
import styles from './page.module.css';

import type { Metadata } from 'next';

////////////////////////////////////////////////////////////////////////////////

export const metadata: Metadata = {
	title: 'Mutate',
};

export default async function MutatePage() {
	const csrfToken = await getCsrfToken();

	const data = await FileSystemDB.getItems();

	return (
		<section>
			<Form csrf={csrfToken} />

			<code className={styles.code}>
				<pre>CSRF: {csrfToken}</pre>
			</code>

			<code className={styles.code}>
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</code>
		</section>
	);
}
