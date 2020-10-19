import { add } from '../src/add';

describe(`add`, () => {
	it(`should add two values`, async () => {
		const res = await add(1, 2);
		expect(res).toEqual(3);
	});
});
