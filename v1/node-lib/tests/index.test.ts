import { add, subtract } from '../src/index';

describe(`add`, () => {
	it(`should add two values`, async () => {
		const res = await add(1, 2);
		expect(res).toEqual(3);
	});
});

////////////////////////////////////////////////////////////////////////////////

describe(`subtract`, () => {
	it(`should subtract two values`, async () => {
		const res = await subtract(3, 1);
		expect(res).toEqual(2);
	});
});
