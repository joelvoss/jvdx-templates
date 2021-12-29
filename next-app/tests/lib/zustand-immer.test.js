/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import { immer } from '@/lib/zustand-immer';
import create from 'zustand';

describe('immer-zustand', () => {
	test('base', () => {
		const useStore = create(
			immer((set, get) => ({
				count: 0,
				inc: () =>
					set(state => {
						state.count = get().count + 1;
					}),
			})),
		);

		const Comp = () => {
			const count = useStore(s => s.count);
			const inc = useStore(s => s.inc);

			if (count === 0) {
				inc();
			}

			return (
				<span>
					{count}, {count * 2}
				</span>
			);
		};

		const { baseElement } = render(<Comp />);
		expect(baseElement.innerHTML).toBe('<div><span>1, 2</span></div>');
	});
});
