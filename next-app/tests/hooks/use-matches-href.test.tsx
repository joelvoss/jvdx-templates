import { render } from '@testing-library/react';
import { useMatchesHref } from '@/hooks/use-matches-href';

describe('useMatchesHref', () => {
	function Comp({ href, exact = true }: { href: string; exact?: boolean }) {
		const matches = useMatchesHref(href, exact);

		return (
			<a href={href} data-active={matches}>
				I'm a link!
			</a>
		);
	}

	test('matches the current pathname', () => {
		const useRouter = jest.spyOn(require('next/router'), 'useRouter');
		useRouter.mockImplementationOnce(() => ({
			asPath: '/test',
		}));

		const { baseElement } = render(<Comp href="/test" />);

		expect(baseElement.innerHTML).toEqual(
			`<div><a href="/test" data-active="true">I'm a link!</a></div>`,
		);
	});

	test('matches sub paths in non-exact mode', () => {
		const useRouter = jest.spyOn(require('next/router'), 'useRouter');
		useRouter.mockImplementationOnce(() => ({
			asPath: '/test/subpath',
		}));

		const { baseElement } = render(<Comp href="/test" exact={false} />);

		expect(baseElement.innerHTML).toEqual(
			`<div><a href="/test" data-active="true">I'm a link!</a></div>`,
		);
	});
});
