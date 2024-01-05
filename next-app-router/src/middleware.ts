import { NextRequest, NextResponse } from 'next/server';
import { handleRequestLocale } from '@/lib/locale/middleware';
import { handleRequestCsrf } from '@/lib/csrf/middleware';

////////////////////////////////////////////////////////////////////////////////

export async function middleware(request: NextRequest) {
	const filtered = filterRequest(request);
	if (filtered) return;

	let response = NextResponse.next();

	response = await handleRequestCsrf(request, response);
	response = handleRequestLocale(request, response);
	return response;
}

////////////////////////////////////////////////////////////////////////////////

function filterRequest(request: NextRequest) {
	// NOTE(joel): To get the current listing of files on Mac, run
	// `ls -pA public | sed -e 's/^/\//'` from the root of this repository.
	if (
		[
			'/android-chrome-192x192.png',
			'/android-chrome-512x512.png',
			'/apple-touch-icon.png',
			'/favicon-16x16.png',
			'/favicon-32x32.png',
			'/favicon.ico',
			'/icon-sprite.svg',
			'/logo.svg',
			'/site.webmanifest',
		].includes(request.nextUrl.pathname)
	) {
		return true;
	}
	return false;
}

////////////////////////////////////////////////////////////////////////////////

export const config = {
	// NOTE(joel): Matcher ignoring `/_next/` and `/api/`
	matcher: ['/((?!api|_next/static|_next/image).*)'],
};
