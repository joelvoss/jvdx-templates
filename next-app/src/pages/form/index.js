import * as React from 'react';
import { request } from 'request-lit';
import { withSSRMiddlewares } from '@/lib/with-ssr-middlewares';
import { getLayout as getSiteLayout } from '@/layouts/site';
import { Meta } from '@/shared/meta';
import * as styles from './styles.module.css';
import { useI18n } from '@/hooks/use-i18n';

////////////////////////////////////////////////////////////////////////////////

export const getServerSideProps = withSSRMiddlewares(async ({ req }) => {
	let { data } = await request.get(`/api/form`, { baseURL: req.baseURL });

	return { props: { data, csrf: req.csrf.token } };
});

////////////////////////////////////////////////////////////////////////////////

export default function FormPage({ data, csrf = '' }) {
	const t = useI18n(s => s.translate);

	return (
		<>
			<Meta title={t(`form.title`)} />

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
						{t(`form.label-text-input`)}
					</label>
					<Input type="text" name="text-input" />
				</fieldset>

				<button className={styles.submit} type="submit">
					{t(`form.submit-button`)}
				</button>
			</form>

			<code className={styles.code}>
				<pre>{t(`form.csrf`, { csrf: JSON.stringify(csrf, null, 2) })}</pre>
			</code>
			<code className={styles.code}>
				<pre>{t(`form.data`, { data: JSON.stringify(data, null, 2) })}</pre>
			</code>
		</>
	);
}

FormPage.getLayout = getSiteLayout;

////////////////////////////////////////////////////////////////////////////////

function Input({ name, ...rest }) {
	return <input className={styles.input} id={name} name={name} {...rest} />;
}
