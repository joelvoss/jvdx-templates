import { render } from '@testing-library/react';
import { resetState, state, useI18n } from '@/hooks/use-i18n';
import { useSnapshot } from 'valtio';

describe('useI18n', () => {
	beforeEach(() => {
		resetState();
	});

	test('translate', () => {
		function Comp() {
			const { t } = useI18n();
			return <span>{t('global.app-title')}</span>;
		}

		const { baseElement } = render(<Comp />);

		expect(baseElement.innerHTML).toBe(
			'<div><span>template-next-app</span></div>',
		);
	});

	test('changeLocale', () => {
		function Comp({ locale }: { locale?: any }) {
			const { changeLocale } = useI18n();
			const snap = useSnapshot(state);

			if (locale) {
				changeLocale({ locale });
			}

			return <span>{JSON.stringify(snap)}</span>;
		}

		// NOTE(joel): Cross-check initial locale
		const { baseElement, rerender } = render(<Comp />);
		expect(baseElement.innerHTML).toBe(
			'<div><span>{"locale":"de","defaultLocale":"de"}</span></div>',
		);

		rerender(<Comp locale="en" />);
		expect(baseElement.innerHTML).toBe(
			'<div><span>{"locale":"en","defaultLocale":"de"}</span></div>',
		);
	});

	test('isDefaultLocale', () => {
		function Comp({ locale }: { locale?: any }) {
			const { changeLocale, isDefaultLocale } = useI18n();

			if (locale) {
				changeLocale({ locale });
			}

			return <span>{JSON.stringify(isDefaultLocale)}</span>;
		}

		// NOTE(joel): Cross-check initial locale
		const { baseElement, rerender } = render(<Comp />);
		expect(baseElement.innerHTML).toBe('<div><span>true</span></div>');

		rerender(<Comp locale="en" />);
		expect(baseElement.innerHTML).toBe('<div><span>false</span></div>');
	});
});
