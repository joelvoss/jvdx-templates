import * as React from 'react';
import { request } from 'request-lit';
import { getHost } from '@/lib/get-host';
import { getCsrf } from '@/lib/get-csrf';
import { getLayout as getSiteLayout } from '@/layouts/site';
import { Meta } from '@/shared/meta';
import * as styles from './styles.module.css';

////////////////////////////////////////////////////////////////////////////////

export async function getServerSideProps({ req }) {
	const csrf = await getCsrf({ req });
	const { origin } = getHost(req);
	let { data } = await request.get(`/api/form`, { baseURL: origin });
	return {
		props: { data, csrf },
	};
}

////////////////////////////////////////////////////////////////////////////////

export default function FormPage({ data, csrf }) {
	return (
		<>
			<Meta title="Form" />

			{/*
				NOTE(joel): This example uses a plain <form> without intercepting
			  it with JavaScript. Server and client have agreed on a convention
				to configure a CSRF token and redirect URL through hidden <input>
				fields.
			*/}
			<form method="POST" action="/api/form">
				<input type="hidden" name="__csrf" defaultValue={csrf} />
				<input type="hidden" name="__redirectTo" defaultValue="/form" />

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
		</>
	);
}

FormPage.getLayout = getSiteLayout;

////////////////////////////////////////////////////////////////////////////////

function Input({ name, ...rest }) {
	return <input className={styles.input} id={name} name={name} {...rest} />;
}
