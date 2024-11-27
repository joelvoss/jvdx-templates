'use client';

import { mutateFormDb } from '@/app/mutate/_actions';
import { CSRF_BODY_NAME } from '@/constants';
import { getI18n } from '@/lib/i18n';
import { useLocale } from '@/lib/locale/client';
import { PendingSubmit } from '@/shared/pending-submit';
import { ToastQueue } from '@/shared/toast';
import styles from './index.module.css';

////////////////////////////////////////////////////////////////////////////////

type FormProps = {
	csrf: string;
};

/**
 * This is a simple form that allows the user to update the database.
 * It is a Client-Side-Rendered (CSR) component, since we want to update the
 * UI if the form submission is successful or not.
 */
export function Form(props: FormProps) {
	const { csrf } = props;
	const lang = useLocale();
	const t = getI18n(lang);

	const action = async (fd: FormData) => {
		try {
			await mutateFormDb(fd);
			ToastQueue.positive(t(`mutate.form.success`), { timeout: 1000 });
		} catch (err: any) {
			ToastQueue.negative(t(`mutate.form.error`, { error: err.message }));
		}
	};

	return (
		<>
			<form action={action}>
				<input type="hidden" name={CSRF_BODY_NAME} value={csrf} />

				<fieldset className={styles.fieldset}>
					<label className={styles.label} htmlFor="text">
						{t(`mutate.form.label`)}
					</label>
					<input type="text" className={styles.input} name="text" />
				</fieldset>

				<fieldset className={styles.fieldset}>
					<PendingSubmit className={styles.submit}>
						{t(`mutate.form.submit`)}
					</PendingSubmit>
				</fieldset>
			</form>
		</>
	);
}
