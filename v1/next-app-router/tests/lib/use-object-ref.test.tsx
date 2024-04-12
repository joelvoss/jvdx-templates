import { act, render } from '@testing-library/react';
import { useObjectRef } from '@/lib/use-object-ref';

describe('Home', () => {
	it('should return a ref object with current property', () => {
		let result: any = {};

		const Comp = () => {
			const domRef = useObjectRef();
			result = domRef;
			return null;
		};

		render(<Comp />);
		expect(result).toHaveProperty('current');
	});

	it('should call the forwardedRef function when the current property is set', () => {
		let result: any = {};
		const forwardedRef = jest.fn();

		const Comp = () => {
			const domRef = useObjectRef(forwardedRef);
			result = domRef;
			return null;
		};

		render(<Comp />);
		act(() => {
			result.current = 'test';
		});
		expect(forwardedRef).toHaveBeenCalledWith('test');
	});

	it('should update the forwardedRef object when the current property is set', () => {
		let result: any = {};
		let forwardedRef = { current: null };

		const Comp = () => {
			const domRef = useObjectRef(forwardedRef);
			result = domRef;
			return null;
		};

		render(<Comp />);
		act(() => {
			result.current = 'test';
		});
		expect(forwardedRef.current).toBe('test');
	});
});
