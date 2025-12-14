'use client';

import {
	type CellContext,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	type RowData,
	useReactTable,
} from '@tanstack/react-table';
import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { Button, type PressEvent } from 'react-aria-components';
import { useI18n } from '@/lib/i18n/client';
import { useQueryState } from '@/lib/query-state/use-query-state';
import { type Book, deleteBook } from './actions';
import { TableEditDialog } from './table-edit-dialog';

////////////////////////////////////////////////////////////////////////////////

declare module '@tanstack/react-table' {
	// biome-ignore lint/correctness/noUnusedVariables: -
	interface TableMeta<TData extends RowData> {
		// NOTE(joel): We namespace the meta to avoid conflicts with other tables.
		booksTable?: {
			onEdit: (id: string) => void;
			onDelete: (id: string) => void;
		};
	}
}

////////////////////////////////////////////////////////////////////////////////

const columnHelper = createColumnHelper<Book>();

////////////////////////////////////////////////////////////////////////////////

interface BooksTableProps {
	initialBooks: Array<Book>;
}

/**
 * BooksTable component renders a table of books with actions for editing and
 * deleting. It uses React Table for rendering and managing the table state.
 */
export function BooksTable(props: BooksTableProps) {
	const { initialBooks } = props;

	// NOTE(joel): We use `useOptimistic` to show the optimistically updated
	// books immediately after a server action, without waiting for the
	// revalidation to complete.
	const [optimisticBooks, setOptimisticBooks] = useOptimistic(
		initialBooks,
		(_, value: typeof initialBooks) => value,
	);

	const t = useI18n();

	const [edit, editSet] = useQueryState('edit');
	const [error, errorSet] = useState<string | null>(null);

	const selectedBook = optimisticBooks.find(book => book.id === edit);

	const columns = useMemo(
		() => [
			columnHelper.accessor('title', { header: t('books.table.header.title') }),
			columnHelper.accessor('author', {
				header: t('books.table.header.author'),
			}),
			columnHelper.accessor('year', { header: t('books.table.header.year') }),
			columnHelper.display({
				id: 'actions',
				cell: ctx => <TableActions ctx={ctx} />,
				size: 8,
			}),
		],
		[],
	);

	const table = useReactTable({
		data: optimisticBooks,
		columns,
		getCoreRowModel: getCoreRowModel(),
		meta: {
			// NOTE(joel): We namespace `meta` to avoid conflicts with other tables.
			booksTable: useMemo(
				() => ({
					onEdit: (id: string) => editSet(id),
					onDelete: async (id: string) => {
						try {
							errorSet(null);
							const updatedBooks = await deleteBook(id);
							setOptimisticBooks(updatedBooks);
						} catch (err) {
							errorSet(err?.message || t('books.errors.delete'));
						}
					},
				}),
				[setOptimisticBooks],
			),
		},
		defaultColumn: {
			size: columns.length > 0 ? 100 / columns.length : 100,
			minSize: 0,
		},
	});

	const isEmpty = optimisticBooks.length === 0;

	return (
		<>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-2xl font-bold text-gray-800'>
					{t('books.heading')}
				</h1>
				<Button
					onPress={() => editSet('new')}
					className='bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow'
				>
					{t('books.add-book')}
				</Button>
			</div>

			<div className='overflow-x-auto rounded-lg border border-gray-200 bg-white shadow'>
				<table className='w-full divide-y divide-gray-200'>
					<thead className='bg-gray-50'>
						{table.getHeaderGroups().map(headerGroup => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<th
										key={header.id}
										colSpan={header.colSpan}
										style={{ width: `${header.getSize()}%` }}
										className='px-6 py-3 text-left font-bold text-gray-700'
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className='bg-white divide-y divide-gray-100'>
						{isEmpty ? (
							<tr>
								<td
									colSpan={columns.length}
									className='px-6 py-4 text-center text-gray-500'
								>
									{t('books.table.empty')}
								</td>
							</tr>
						) : (
							table.getRowModel().rows.map(row => (
								<tr key={row.id} className='hover:bg-gray-50 transition'>
									{row.getVisibleCells().map(cell => (
										<td
											key={cell.id}
											style={{ width: `${cell.column.getSize()}%` }}
											className='px-6 py-4 whitespace-nowrap text-gray-800'
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{error && (
				<div className='mt-4 p-4 text-red-600 bg-red-100 border border-red-200 rounded'>
					{error}
				</div>
			)}

			<TableEditDialog
				book={selectedBook}
				setOptimisticBooks={setOptimisticBooks}
			/>
		</>
	);
}

////////////////////////////////////////////////////////////////////////////////

interface TableActionsProps {
	ctx: CellContext<Book, unknown>;
}

/**
 * TableActions component renders action buttons for each book row.
 * It includes edit and delete buttons with appropriate handlers.
 */
export function TableActions(props: TableActionsProps) {
	const {
		table: {
			options: { meta },
		},
		row: { original },
	} = props.ctx;

	const t = useI18n();

	const [isPending, startTransition] = useTransition();

	const onEdit = (_: PressEvent) => {
		if (isPending) return;
		meta.booksTable.onEdit(original.id);
	};
	const onDelete = (_: PressEvent) => {
		if (isPending) return;
		startTransition(() => meta.booksTable.onDelete(original.id));
	};

	return (
		<div className='flex gap-1'>
			<Button
				type='button'
				onPress={onEdit}
				aria-label={t('books.table.actions.edit')}
				isDisabled={isPending}
				className='cursor-pointer rounded bg-gray-100 px-2 py-1 text-neutral-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-neutral-500 data-active:bg-gray-200'
			>
				<svg className='w-4 h-4' aria-hidden='true'>
					<use xlinkHref='#edit' />
				</svg>
			</Button>

			<Button
				type='button'
				onPress={onDelete}
				aria-label={t('books.table.actions.delete')}
				isDisabled={isPending}
				className='cursor-pointer rounded bg-gray-100 px-2 py-1 text-neutral-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-neutral-500 data-active:bg-gray-200'
			>
				{isPending ? (
					<svg className='w-4 h-4 animate-spin' aria-hidden='true'>
						<use xlinkHref='#loading' />
					</svg>
				) : (
					<svg className='w-4 h-4' aria-hidden='true'>
						<use xlinkHref='#delete' />
					</svg>
				)}
			</Button>
		</div>
	);
}
