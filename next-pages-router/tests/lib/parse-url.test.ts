// @ts-nocheck

import { parseURL } from '@/lib/parse-url';

describe('parseURL', () => {
	describe('base', () => {
		test('return fallback URL', () => {
			expect(parseURL()).toEqual({
				basePath: '/',
				baseURL: 'http://localhost:3000',
			});
		});

		test('return parsed URL', () => {
			expect(parseURL('http://example.com')).toEqual({
				basePath: '/',
				baseURL: 'http://example.com',
			});

			expect(parseURL('http://example.com/test')).toEqual({
				basePath: '/test',
				baseURL: 'http://example.com',
			});
		});

		test('default to HTTPS if no protocol is set (non localhost)', () => {
			expect(parseURL('example.com')).toEqual({
				basePath: '/',
				baseURL: 'https://example.com',
			});
		});

		test('default to HTTP if no protocol is set (localhost)', () => {
			expect(parseURL('localhost:3000')).toEqual({
				basePath: '/',
				baseURL: 'http://localhost:3000',
			});
		});

		test('respect protocol', () => {
			expect(parseURL('https://localhost:3000')).toEqual({
				basePath: '/',
				baseURL: 'https://localhost:3000',
			});

			expect(parseURL('https://example.com')).toEqual({
				basePath: '/',
				baseURL: 'https://example.com',
			});
		});

		test('handle query parameter', () => {
			expect(parseURL('example.com/path?value=test')).toEqual({
				basePath: '/path?value=test',
				baseURL: 'https://example.com',
			});
		});
	});
});
