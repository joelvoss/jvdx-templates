import { render } from '@testing-library/react';
import { useI18n } from '@/hooks/use-i18n';

describe('useI18n', () => {
	const initialStoreState = useI18n.getState();

	beforeEach(() => {
		useI18n.setState(initialStoreState, true);
	});

	test('translate', () => {
		function Comp() {
			const translate = useI18n(s => s.translate);
			return <span>{translate('global.app-title')}</span>;
		}

		const { baseElement } = render(<Comp />);

		expect(baseElement.innerHTML).toBe(
			'<div><span>template-next-app</span></div>',
		);
	});

	test('changeLocale', () => {
		function Comp({ locale }: { locale?: any }) {
			const changeLocale = useI18n(s => s.changeLocale);
			const _locale = useI18n(s => s.locale);

			if (locale) {
				changeLocale({ locale });
			}

			return <span>{_locale}</span>;
		}

		// NOTE(joel): Cross-check initial locale
		const { baseElement, rerender } = render(<Comp />);
		expect(baseElement.innerHTML).toBe('<div><span>de</span></div>');

		rerender(<Comp locale="en" />);
		expect(baseElement.innerHTML).toBe('<div><span>en</span></div>');
	});

	test('isDefaultLocale', () => {
		function Comp({ locale }: { locale?: any }) {
			const isDefaultLocale = useI18n(s => s.isDefaultLocale);
			const changeLocale = useI18n(s => s.changeLocale);

			if (locale) {
				changeLocale({ locale });
			}

			if (isDefaultLocale()) {
				return <span>true</span>;
			}
			return <span>false</span>;
		}

		// NOTE(joel): Cross-check initial locale
		const { baseElement, rerender } = render(<Comp />);
		expect(baseElement.innerHTML).toBe('<div><span>true</span></div>');

		rerender(<Comp locale="en" />);
		expect(baseElement.innerHTML).toBe('<div><span>false</span></div>');
	});
});
