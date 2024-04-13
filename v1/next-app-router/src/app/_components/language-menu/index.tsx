'use client';

import {
	Button,
	Menu,
	MenuItem,
	MenuTrigger,
	Popover,
} from 'react-aria-components';
import { getI18n } from '@/lib/i18n';
import { useLocale } from '@/lib/locale/client';
import { mergeProps } from '@/lib/merge-props';
import styles from './index.module.css';

import type { MenuItemProps } from 'react-aria-components';

////////////////////////////////////////////////////////////////////////////////

/**
 * A button that opens a language menu.
 */
export function LanguageMenu() {
	const lang = useLocale();
	const t = getI18n(lang);

	return (
		<MenuTrigger>
			<Button aria-label={t('language-menu.label')} className={styles.button}>
				<svg aria-hidden>
					<use xlinkHref="#translate" />
				</svg>
			</Button>
			<Popover className={styles.popover}>
				<Menu className={styles.menu}>
					<Item
						href="?hl=de"
						label={t('language-menu.de')}
						icon="#flag-german"
					/>
					<Item
						href="?hl=en"
						label={t('language-menu.en')}
						icon="#flag-english"
					/>
				</Menu>
			</Popover>
		</MenuTrigger>
	);
}

////////////////////////////////////////////////////////////////////////////////

interface ItemProps extends MenuItemProps {
	label: string;
	icon: string;
}

/**
 * A menu item that renders a flag icon and a label.
 */
function Item(props: ItemProps) {
	const { icon, label, ...itemProps } = mergeProps(props, {
		className: styles.item,
		textValue: props.label,
		'aria-label': props.label,
	});

	// NOTE(joel): Locale changes must be full page reloads to
	// circumvent Next's route cache. The default tag the `<MenuItem>` component
	// renders is an `<a>` tag, which is exactly what we want here.
	return (
		<MenuItem {...itemProps}>
			<svg aria-hidden>
				<use xlinkHref={icon} />
			</svg>
			<span>{label}</span>
		</MenuItem>
	);
}
