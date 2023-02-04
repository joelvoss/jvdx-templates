import Link from 'next/link';
import { useMatchesHref } from '@/hooks/use-matches-href';
import { useI18n } from '@/hooks/use-i18n';
import styles from './styles.module.css';

import type { ReactNode } from 'react';

type SiteLayoutProps = {
	children?: React.ReactNode;
};

/**
 * The basic layout consisting of a header with navigation and a content area.
 */
function SiteLayout(props: SiteLayoutProps) {
	const { children } = props;
	const { t } = useI18n();

	return (
		<>
			<nav className={styles.nav}>
				<div className={styles.links}>
					<Link href="/" title={t('global.app-title')}>
						<img className={styles.logo} src="/logo.svg" alt="" />
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

type NavLinkProps = {
	[key: string]: any;
	href: string;
	exact?: boolean;
	className?: string;
	children: ReactNode;
};

function NavLink(props: NavLinkProps) {
	const { href, exact = true, className = '', children, ...rest } = props;
	const matches = useMatchesHref(href, exact);
	const cls = className ? `${styles.navLink} ${className}` : styles.navLink;

	return (
		<Link
			href={href}
			prefetch={false}
			className={cls}
			data-active={matches}
			{...rest}
		>
			{children}
		</Link>
	);
}

////////////////////////////////////////////////////////////////////////////////

export function getLayout(page: ReactNode) {
	return <SiteLayout>{page}</SiteLayout>;
}
