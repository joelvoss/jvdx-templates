import { isOriginAllowed } from '@/lib/is-origin-allowed';

describe('isOriginAllowed', () => {
	test('against a single string origin', () => {
		let allowed = isOriginAllowed('my-allowed-origin', 'my-allowed-origin');
		expect(allowed).toBe(true);

		allowed = isOriginAllowed('not-allowed-origin', 'my-allowed-origin');
		expect(allowed).toBe(false);
	});

	test('against multiple string origins', () => {
		let allowed = isOriginAllowed('my-allowed-origin', [
			'my-allowed-origin',
			'another-origin',
		]);
		expect(allowed).toBe(true);

		allowed = isOriginAllowed('another-origin', [
			'my-allowed-origin',
			'another-origin',
		]);
		expect(allowed).toBe(true);

		allowed = isOriginAllowed('not-allowed-origin', [
			'my-allowed-origin',
			'another-origin',
		]);
		expect(allowed).toBe(false);
	});

	test('against a regexp origin', () => {
		let allowed = isOriginAllowed('my-allowed-origin', /.*/);
		expect(allowed).toBe(true);

		allowed = isOriginAllowed('also-allowed-origin', /.*-allowed-.*/);
		expect(allowed).toBe(true);

		allowed = isOriginAllowed('notallowed-origin', /.*-allowed-.*/);
		expect(allowed).toBe(false);
	});

	test('against a boolean origin', () => {
		let allowed = isOriginAllowed('my-allowed-origin', true);
		expect(allowed).toBe(true);
	});
});
