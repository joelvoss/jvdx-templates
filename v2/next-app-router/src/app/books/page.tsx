import { FileSystemDB } from '@/db/file-system-db';
import { BooksTable } from './table';

////////////////////////////////////////////////////////////////////////////////

/**
 * Books page component that fetches books from the file system database
 * and renders them in a table.
 */
export default async function BooksPage() {
	const db = await FileSystemDB.getItems();
	const books = db.books || [];

	return (
		<section className='mt-8'>
			<BooksTable initialBooks={books} />
		</section>
	);
}
