import Link from 'next/link';
import { getLayout as getSiteLayout } from '@/layouts/site';
import { Meta } from '@/shared/meta';
import * as styles from './styles.module.css';

export default function Custom404() {
	return (
		<section className={styles.section}>
			<Meta title="404 | Page Not Found" />

			<div className={styles.container}>
				<h1 className={styles.h1}>
					<b>404</b> | Page Not Found
				</h1>
				<p className={styles.p}>
					<i>The page you are looking for can’t be found.</i>
				</p>
				<Link href="/">
					<a className={styles.link}>← Back to Home</a>
				</Link>
			</div>
		</section>
	);
}

Custom404.getLayout = getSiteLayout;
