import { describe, expect, it } from 'vitest';
import { parseURL } from '@/lib/parse-url';

describe('parseURL', () => {
	it('parses a full URL with protocol', () => {
		expect(parseURL('http://example.com/foo/bar')).toEqual({
			baseURL: 'http://example.com',
			basePath: '/foo/bar',
		});
		expect(parseURL('https://example.com/foo/bar/')).toEqual({
			baseURL: 'https://example.com',
			basePath: '/foo/bar',
		});
	});

	it('defaults to http://localhost:3000/', () => {
		expect(parseURL()).toEqual({
			baseURL: 'http://localhost:3000',
			basePath: '/',
		});
	});

	it('defaults to https if protocol not specified', () => {
		expect(parseURL('example.com/foo')).toEqual({
			baseURL: 'https://example.com',
			basePath: '/foo',
		});
	});

	it('removes trailing slash', () => {
		expect(parseURL('https://example.com/foo/')).toEqual({
			baseURL: 'https://example.com',
			basePath: '/foo',
		});
	});
});
