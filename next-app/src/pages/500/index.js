import Link from 'next/link';
import { getLayout as getSiteLayout } from '@/layouts/site';
import { Meta } from '@/shared/meta';
import * as styles from './styles.module.css';

export default function Custom500() {
	return (
		<section className={styles.section}>
			<Meta title="500 | Error" />

			<div className={styles.container}>
				<h1 className={styles.h1}>
					<b>500</b> | Error
				</h1>
				<p className={styles.p}>
					<i>An unknown server error occured.</i>
				</p>
				<Link href="/">
					<a className={styles.link}>← Back to Home</a>
				</Link>
			</div>
		</section>
	);
}

Custom500.getLayout = getSiteLayout;
