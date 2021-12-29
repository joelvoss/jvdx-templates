import Link from 'next/link';
import { useMatchesHref } from '@/hooks/use-matches-href';
import { useI18n } from '@/hooks/use-i18n';
import * as styles from './styles.module.css';

/**
 * The basic layout consisting of a header with navigation and a content area.
 */
function SiteLayout({ children }) {
	const t = useI18n(s => s.translate);

	return (
		<>
			<nav className={styles.nav}>
				<div className={styles.links}>
					<Link href="/">
						<a title={t('global.app-title')}>
							<img className={styles.logo} src="/logo.svg" alt="" />
						</a>
					</Link>

					<NavLink href="/">{t('global.nav.home')}</NavLink>
					<NavLink href="/form" exact={false}>
						{t('global.nav.form')}
					</NavLink>
					<NavLink href="/form-js" exact={false}>
						{t('global.nav.form-js')}
					</NavLink>
				</div>
			</nav>
			<main className={styles.main}>{children}</main>
		</>
	);
}

////////////////////////////////////////////////////////////////////////////////

function NavLink({ href, exact = true, className = '', children, ...rest }) {
	const matches = useMatchesHref(href, exact);
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
