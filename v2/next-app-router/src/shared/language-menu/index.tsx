'use client';

import type { MenuItemProps } from 'react-aria-components';
import {
	Button,
	Menu,
	MenuItem,
	MenuTrigger,
	Popover,
} from 'react-aria-components';
import { useI18n } from '@/lib/i18n/client';
import { useLocale } from '@/lib/locale/client';
import { mergeProps } from '@/lib/merge-props';

////////////////////////////////////////////////////////////////////////////////

/**
 * A button that opens a language menu.
 */
export function LanguageMenu() {
	const lang = useLocale();
	const t = useI18n(lang);

	return (
		<MenuTrigger>
			<Button
				aria-label={t('language-menu.label')}
				className='cursor-pointer rounded-sm px-4 py-3 font-medium text-neutral-900 hover:bg-gray-200  data-pressed:bg-gray-200'
			>
				<svg aria-hidden className='size-4'>
					<use xlinkHref='#translate' />
				</svg>
			</Button>
			<Popover className='max-w-3xs rounded-md border border-gray-200 bg-white shadow-lg'>
				<Menu className='p-[2px]'>
					<Item
						href='?hl=de'
						label={t('language-menu.de')}
						icon='#flag-german'
					/>
					<Item
						href='?hl=en'
						label={t('language-menu.en')}
						icon='#flag-english'
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
		className:
			'grid grid-cols-[1rem_auto] gap-x-2 items-center m-px px-2 py-1 rounded-md outline-none text-neutral-900 data-hovered:bg-gray-200 data-focused:bg-gray-200',
		textValue: props.label,
		'aria-label': props.label,
	});

	// NOTE(joel): Locale changes must be full page reloads to
	// circumvent Next's route cache. The default tag that the `<MenuItem>`
	// component renders is an `<a>` tag, which is exactly what we want here.
	return (
		<MenuItem {...itemProps}>
			<svg aria-hidden className='size-4'>
				<use xlinkHref={icon} />
			</svg>
			<span>{label}</span>
		</MenuItem>
	);
}
