import { useState } from 'react';
import { request } from 'request-lit';
import { error } from '@/lib/logger';
import { getHost } from '@/lib/get-host';
import { getLayout as getSiteLayout } from '@/layouts/site';
import { Meta } from '@/shared/meta';
import { useCsrf } from '@/hooks/use-csrf';
import { useSubmit } from '@/hooks/use-submit';
import * as styles from './styles.module.css';

////////////////////////////////////////////////////////////////////////////////

export async function getServerSideProps({ req }) {
	const { origin } = getHost(req);
	let { data } = await request.get(`/api/form`, { baseURL: origin });
	return {
		props: { data },
	};
}

////////////////////////////////////////////////////////////////////////////////

export default function FormWithJSPage({ data }) {
	// NOTE(joel): In this example we're getting the CSRF token client side.
	const { csrf } = useCsrf();

	// NOTE(joel): This example intercepts the form's `onSubmit` action and
	// performs the POST request client side with JavaScript. This allows us to
	// render a loading spinner while the request is in flight.
	const [status, setStatus] = useState('idle');
	const submit = useSubmit(
		async (url, form) => {
			setStatus('loading');
			try {
				// NOTE(joel): Make sure to pass the CSRF token when making client
				// side request.
				await request
					.post(url.pathname, form, { csrf })
					.catch(err => error(err.message));
				setStatus('success');
			} catch (err) {
				error(`ERROR_POSTING_ASSETS`, err.message);
				setStatus('error');
			}
		},
		{ serialize: true, replace: true, redirect: `/form-js` },
	);

	return (
		<>
			<Meta title="Form" />

			<form method="POST" action="/api/form" onSubmit={submit}>
				<fieldset className={styles.fieldset}>
					<label htmlFor="text-input" className={styles.label}>
						Text input
					</label>
					<Input type="text" name="text-input" />
				</fieldset>

				<button className={styles.submit} type="submit">
					Submit
				</button>
			</form>

			<code className={styles.code}>
				<pre>CSRF: {JSON.stringify(csrf, null, 2)}</pre>
			</code>
			<code className={styles.code}>
				<pre>Data: {JSON.stringify(data, null, 2)}</pre>
			</code>

			{status === 'loading' ? <Spinner /> : null}
		</>
	);
}

FormWithJSPage.getLayout = getSiteLayout;

////////////////////////////////////////////////////////////////////////////////

function Input({ name, ...rest }) {
	return <input className={styles.input} id={name} name={name} {...rest} />;
}

////////////////////////////////////////////////////////////////////////////////

function Spinner() {
	return <span className={styles.spinner}>🌀</span>;
}
