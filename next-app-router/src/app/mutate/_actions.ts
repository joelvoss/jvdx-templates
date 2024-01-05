'use server';

import { FileSystemDB } from '@/db/file-system-db';
import { verifyCsrf } from '@/lib/csrf/server';
import { revalidatePath } from 'next/cache';

////////////////////////////////////////////////////////////////////////////////

export async function mutateFormDb(fd: FormData) {
	// NOTE(joel): Next.js/React server actions are already protected against CSRF
	// attacks by comparing `Origin` and `Host` headers, but we can add an
	// additional layer of security by verifying the CSRF token manually.
	// This must be done for API routes anyway, as these are not automatically
	// secured by Next.js
	if (!verifyCsrf()) {
		throw new Error('E001 - INVALID_CSRF');
	}

	const text = fd.get('text');
	await FileSystemDB.updateItems({ text });
	revalidatePath('/mutate');
}
