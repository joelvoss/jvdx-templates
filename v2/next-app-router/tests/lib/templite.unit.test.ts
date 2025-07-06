import { describe, expect, it } from 'vitest';
import { templite } from '@/lib/templite';

describe('templite', () => {
	it('replaces simple keys', () => {
		expect(templite('Hello, {{name}}!', { name: 'World' })).toBe(
			'Hello, World!',
		);
	});

	it('replaces nested keys', () => {
		expect(templite('Value: {{foo.bar}}', { foo: { bar: 42 } })).toBe(
			'Value: 42',
		);
	});

	it('replaces array indices', () => {
		expect(templite('First: {{0}}, Second: {{1}}', ['a', 'b'])).toBe(
			'First: a, Second: b',
		);
	});

	it('returns empty string for missing keys', () => {
		expect(templite('Missing: {{notfound}}', {})).toBe('Missing: ');
	});

	it('handles multiple replacements', () => {
		expect(templite('A: {{a}}, B: {{b}}', { a: 1, b: 2 })).toBe('A: 1, B: 2');
	});
});
