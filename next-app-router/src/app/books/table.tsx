'use client';

import { useState } from 'react';
import { Button } from 'react-aria-components';
import { useI18n } from '@/lib/i18n/client';
import { useOptimisticCollection } from '@/lib/use-optimistic-collection';
import { type Book, createBook, deleteBook, updateBook } from './actions';
import { TableMutationDialog } from './table-mutation-dialog';

////////////////////////////////////////////////////////////////////////////////

interface BooksTableProps {
	initialBooks: Array<Book>;
}

////////////////////////////////////////////////////////////////////////////////

export function BooksTable({ initialBooks }: BooksTableProps) {
	const t = useI18n();
	const [dialogBook, setDialogBook] = useState<Book | 'new' | null>(null);
	const {
		items: books,
		error,
		removingIds: deletingIds,
		pendingMutations,
		addItem: addBook,
		removeItem: removeBook,
		updateItem: editBook,
		clearError,
	} = useOptimisticCollection<Book>(initialBooks, {
		create: createBook,
		update: updateBook,
		remove: deleteBook,
		errors: {
			create: t('books.errors.create'),
			update: t('books.errors.update'),
			remove: t('books.errors.delete'),
		},
	});

	return (
		<section className='mx-auto mt-12 max-w-7xl'>
			<div className='mb-6 flex items-end justify-between gap-4'>
				<div className='flex items-center gap-3'>
					<h1 className='text-3xl font-bold tracking-tight text-gray-950'>
						{t('books.heading')}
					</h1>
					<div
						className='text-gray-400'
						role='img'
						aria-label={
							pendingMutations > 0
								? t('books.mutations.saving')
								: t('books.mutations.saved')
						}
					>
						{pendingMutations > 0 ? (
							<svg className='size-4 animate-spin' aria-hidden='true'>
								<use xlinkHref='#loading' />
							</svg>
						) : (
							<svg
								className='size-4 text-gray-300'
								viewBox='0 0 24 24'
								aria-hidden='true'
							>
								<path
									fill='currentColor'
									d='M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.9 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96ZM10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8Z'
								/>
							</svg>
						)}
					</div>
				</div>
				<Button
					onPress={() => {
						clearError();
						setDialogBook('new');
					}}
					className='cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
				>
					{t('books.add-book')}
				</Button>
			</div>

			<div className='overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'>
				<table className='w-full text-left'>
					<thead className='bg-gray-50 text-sm text-gray-600'>
						<tr>
							<th className='px-6 py-3 font-semibold'>
								{t('books.table.header.title')}
							</th>
							<th className='px-6 py-3 font-semibold'>
								{t('books.table.header.author')}
							</th>
							<th className='px-6 py-3 text-right font-semibold'>
								{t('books.table.header.year')}
							</th>
							<th className='px-6 py-3 text-right font-semibold'>
								{t('books.table.header.actions')}
							</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-100'>
						{books.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className='px-6 py-12 text-center text-gray-500'
								>
									{t('books.table.empty')}
								</td>
							</tr>
						) : (
							books.map(book => (
								<tr key={book.id} className='hover:bg-blue-50/40'>
									<td className='px-6 py-4 font-medium text-gray-950'>
										{book.title}
									</td>
									<td className='px-6 py-4 text-gray-600'>{book.author}</td>
									<td className='px-6 py-4 text-right tabular-nums text-gray-600'>
										{book.year}
									</td>
									<td className='px-6 py-4 text-right'>
										<Button
											onPress={() => {
												clearError();
												setDialogBook(book);
											}}
											isDisabled={deletingIds.has(book.id)}
											aria-label={t('books.table.actions.edit')}
											className='cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50'
										>
											<svg className='size-4' aria-hidden='true'>
												<use xlinkHref='#edit' />
											</svg>
										</Button>
										<Button
											onPress={() => removeBook(book)}
											isDisabled={deletingIds.has(book.id)}
											aria-label={t('books.table.actions.delete')}
											className='cursor-pointer rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50'
										>
											<svg className='size-4' aria-hidden='true'>
												<use xlinkHref='#delete' />
											</svg>
										</Button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{error && (
				<p
					role='alert'
					className='mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
				>
					{error}
				</p>
			)}

			<TableMutationDialog
				book={dialogBook}
				onClose={() => setDialogBook(null)}
				onSubmit={book => {
					setDialogBook(null);
					if ('id' in book) editBook(book);
					else addBook(book);
				}}
			/>
		</section>
	);
}
