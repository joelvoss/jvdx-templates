import { useState } from 'react';
import { request } from 'request-lit';
import { error } from '@/lib/logger';
import { withSSRMiddlewares } from '@/lib/with-ssr-middlewares';
import { useCsrf } from '@/hooks/use-csrf';
import { useSubmit } from '@/hooks/use-submit';
import { getLayout as getSiteLayout } from '@/layouts/site';
import { Meta } from '@/shared/meta';
import { useI18n } from '@/hooks/use-i18n';
import styles from './styles.module.css';

////////////////////////////////////////////////////////////////////////////////

export const getServerSideProps = withSSRMiddlewares(async ({ req }) => {
	let res = await request.get(`${req.baseURL}/api/form`);
	let data = await res.json();
	return { props: { data } };
});

////////////////////////////////////////////////////////////////////////////////

type FormWithJSPageProps = {
	data: any;
};

export default function FormWithJSPage(props: FormWithJSPageProps) {
	const { data } = props;
	const { t } = useI18n();

	// NOTE(joel): In this example we're getting the CSRF token client side.
	const { token: csrf } = useCsrf();

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
					.post(url.pathname, {
						json: form as {},
						headers: { 'x-xsrf-token': csrf! },
					})
					.catch(err => error(err.message));
				setStatus('success');
			} catch (err: any) {
				error(`ERROR_POSTING_ASSETS`, err.message);
				setStatus('error');
			}
		},
		{ serialize: true, replace: true, redirect: `/form-js` },
	);

	return (
		<>
			<Meta title={t(`form-js.title`)} />

			<form method="POST" action="/api/form" onSubmit={submit}>
				<fieldset className={styles.fieldset}>
					<label htmlFor="text-input" className={styles.label}>
						{t(`form-js.label-text-input`)}
					</label>
					<Input type="text" name="text-input" />
				</fieldset>

				<button className={styles.submit} type="submit">
					{t(`form-js.submit-button`)}
				</button>
			</form>

			<code className={styles.code}>
				<pre>{t(`form-js.csrf`, { csrf: JSON.stringify(csrf, null, 2) })}</pre>
			</code>
			<code className={styles.code}>
				<pre>{t(`form-js.data`, { data: JSON.stringify(data, null, 2) })}</pre>
			</code>

			{status === 'loading' ? <Spinner /> : null}
		</>
	);
}

FormWithJSPage.getLayout = getSiteLayout;

////////////////////////////////////////////////////////////////////////////////

type InputProps = {
	name: string;
	[key: string]: any;
};

function Input(props: InputProps) {
	const { name, ...rest } = props;
	return <input className={styles.input} id={name} name={name} {...rest} />;
}

////////////////////////////////////////////////////////////////////////////////

function Spinner() {
	const { t } = useI18n();
	return <span className={styles.spinner}>{t(`form-js.spinner`)}</span>;
}
