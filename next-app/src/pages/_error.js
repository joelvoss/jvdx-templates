import Link from 'next/link';
import { getLayout as getSiteLayout } from '@/layouts/site';
import { Meta } from '@/shared/meta';
import * as styles from './_error.module.css';

export default function Error({ statusCode }) {
	return (
		<section className={styles.section}>
			<Meta title={`${statusCode} | Error`} />

			<div className={styles.container}>
				<h1 className={styles.h1}>
					<b>{statusCode}</b> | Error
				</h1>
				<p className={styles.p}>
					{statusCode ? (
						<i>A {statusCode} error occurred on the server.</i>
					) : (
						<i>An unknown error occurred on the client.</i>
					)}
				</p>
				<Link href="/">
					<a className={styles.link}>← Back to Home</a>
				</Link>
			</div>
		</section>
	);
}

Error.getInitialProps = ({ res, err }) => {
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
	return { statusCode };
};

Error.getLayout = getSiteLayout;
