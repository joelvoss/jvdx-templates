import { templite } from '@/lib/templite';

describe('templite', () => {
	test('object', () => {
		const template = 'Hello, {{name}}!';
		const data = { name: 'world' };

		expect(templite(template, data)).toBe('Hello, world!');
		// NOTE(joel): Input string intact
		expect(template).toBe('Hello, {{name}}!');
		// NOTE(joel): Input object intact
		expect(data).toEqual({ name: 'world' });
	});

	test('array', () => {
		const template = 'Hello, {{0}}!';
		const data = ['world'];

		expect(templite(template, data)).toBe('Hello, world!');
		// NOTE(joel): Input string intact
		expect(template).toBe('Hello, {{0}}!');
		// NOTE(joel): Input object intact
		expect(data).toEqual(['world']);
	});

	test('repeats', () => {
		expect(templite('{{0}}{{0}}{{0}}', ['🎉'])).toBe('🎉🎉🎉');
		expect(templite('{{0}}{{0}}{{0}}', ['hi'])).toBe('hihihi');
	});

	test('invalid keys', () => {
		expect(templite('{{a}}{{c}}{{b}}', { a: 1, b: 2 })).toBe('12');
		expect(templite('{{0}}{{2}}{{1}}', [1, 2])).toBe('12');
	});

	test('null keys', () => {
		expect(templite('{{a}}-{{b}}', { a: null, b: undefined })).toBe('-');
		expect(templite('{{0}}-{{1}}', [null, undefined])).toBe('-');
	});

	test('nested keys', () => {
		expect(
			templite('{{name}} {{foo.bar.baz}}', {
				name: 'John',
				foo: { bar: { baz: 'Smith' } },
			}),
		).toBe('John Smith');
		expect(templite('{{0}} {{1.0.0}}', ['John', [[['Smith']]]])).toBe(
			'John Smith',
		);
	});

	test('nested keys (invalid)', () => {
		expect(templite('{{foo.bar}}', { foo: 123 })).toBe('');
		expect(templite('{{foo.bar.baz}}', { foo: 123 })).toBe('');
		expect(templite('{{0.1}}', [123])).toBe('');
		expect(templite('{{0.1.2}}', [123])).toBe('');
	});

	test('trim keys (whitespace)', () => {
		expect(templite('{{ foo }}', { foo: 123, bar: { baz: 456 } })).toBe('123');
		expect(templite('{{ bar.baz }}', { foo: 123, bar: { baz: 456 } })).toBe(
			'456',
		);
		expect(templite('{{ 0 }}', [123, [456]])).toBe('123');
		expect(templite('{{ 1.0 }}', [123, [456]])).toBe('456');
	});

	test('multiline string', () => {
		expect(
			templite('\nApples: {{foo}}\n\nOranges: {{bar}}', { foo: 123, bar: 456 }),
		).toBe('\nApples: 123\n\nOranges: 456');
		expect(
			templite(
				`
				Apples: {{foo}}
				Oranges: {{bar}}
		`,
				{ foo: 123, bar: 456 },
			),
		).toBe('\n\t\t\t\tApples: 123\n\t\t\t\tOranges: 456\n\t\t');
	});
});
