import Link from 'next/link';
import { useMatchesHref } from '@/hooks/use-matches-href';
import * as styles from './styles.module.css';

/**
 * The basic layout consisting of a header with navigation and a content area.
 */
function SiteLayout({ children }) {
	return (
		<>
			<nav className={styles.nav}>
				<div className={styles.links}>
					<Link href="/">
						<a>
							<img className={styles.logo} src="/logo.svg" alt="" />
						</a>
					</Link>

					<NavLink href="/">Home</NavLink>
					<NavLink href="/form">Form (w/o JS)</NavLink>
					<NavLink href="/form-js">Form (with JS)</NavLink>
				</div>
			</nav>
			<main className={styles.main}>{children}</main>
		</>
	);
}

////////////////////////////////////////////////////////////////////////////////

function NavLink({ href, className = '', children, ...rest }) {
	const matches = useMatchesHref(href, true);
	const cls = className ? `${styles.navLink} ${className}` : styles.navLink;

	return (
		<Link href={href} prefetch={false} {...rest}>
			<a className={cls} data-active={matches}>
				{children}
			</a>
		</Link>
	);
}

////////////////////////////////////////////////////////////////////////////////

export function getLayout(page) {
	return <SiteLayout>{page}</SiteLayout>;
}
