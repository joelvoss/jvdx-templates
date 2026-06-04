import { Firestore as GCFirestore } from '@google-cloud/firestore';

import { logger } from '~/lib/logger';

////////////////////////////////////////////////////////////////////////////////

let client = new GCFirestore({ ignoreUndefinedProperties: true });

////////////////////////////////////////////////////////////////////////////////

interface Book {
	id: string;
	title: string;
	author: string;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Get all books from the 'books' collection.
 */
async function listBooks() {
	logger.info('Listing books from Firestore');
	let snap = await client.collection('books').get();
	let books = snap.docs.map((doc) => {
		return { id: doc.id, ...doc.data() };
	});
	return books as Book[];
}

////////////////////////////////////////////////////////////////////////////////

export let Firestore = {
	listBooks,
};
