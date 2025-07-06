'use client';

import { startTransition, useActionState } from 'react';
import {
	Button,
	Dialog,
	DialogTrigger,
	Heading,
	Input,
	Label,
	Modal,
	ModalOverlay,
	TextField,
} from 'react-aria-components';
import { useI18n } from '@/lib/i18n/client';
import { useLocale } from '@/lib/locale/client';
import { useQueryState } from '@/lib/query-state/use-query-state';
import { type Book, createBook, updateBook } from './actions';

////////////////////////////////////////////////////////////////////////////////

interface TableEditDialogProps {
	book?: Partial<Book>;
	setOptimisticBooks: (action: Book[]) => void;
}

/**
 * TableEditDialog component for creating or editing a book.
 * Displays a modal dialog with a form to input book details.
 * Handles both creation of new books and editing existing ones.
 */
export function TableEditDialog(props: TableEditDialogProps) {
	const { book, setOptimisticBooks } = props;

	const lang = useLocale();
	const t = useI18n(lang);

	const [edit, editSet] = useQueryState('edit');

	const isOpen = edit != null;
	const isEditing = isOpen && edit !== 'new';

	const [error, formAction, isPending] = useActionState<string, FormData>(
		async (_, fd) => {
			if (fd == null) return null;

			try {
				const partialBook = Object.fromEntries(fd) as Partial<Book>;
				if (isEditing) {
					const updatedBooks = await updateBook({
						id: book.id,
						...partialBook,
					});
					setOptimisticBooks(updatedBooks);
				} else {
					const updatedBooks = await createBook(partialBook);
					setOptimisticBooks(updatedBooks);
				}
				editSet(null);
			} catch (err) {
				return err.message;
			}
		},
		null,
	);

	const closeDialog = () => {
		startTransition(() => {
			// NOTE(joel): Reset the form action and close the dialog.
			formAction(null);
			editSet(null);
		});
	};

	return (
		<DialogTrigger isOpen={isOpen}>
			<ModalOverlay className='fixed inset-0 z-10 w-screen bg-gray-500/75 data-[entering]:animate-modal-enter'>
				<Modal className='flex min-h-full justify-center text-center data-[entering]:animate-modal-zoom items-center p-0'>
					<Dialog className='relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl mx-4 w-full max-w-lg'>
						<form action={formAction}>
							<input type='hidden' name='id' defaultValue={book?.id} readOnly />

							{/* Dialog Content */}
							<div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
								<div className='text-center sm:text-left'>
									<Heading
										slot='title'
										className='text-xl font-semibold text-gray-900'
									>
										{isEditing
											? t('books.dialog.edit-title')
											: t('books.dialog.create-title')}
									</Heading>
									<p className='mt-2 text-sm text-gray-500'>
										{isEditing
											? t('books.dialog.edit-desc')
											: t('books.dialog.create-desc')}
									</p>

									<div className='mt-4 grid gap-1'>
										<TextField
											type='text'
											defaultValue={book?.title}
											className='grid'
										>
											<Label className='font-semibold'>
												{t('books.dialog.title-label')}
											</Label>
											<Input
												name='title'
												className='rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'
											/>
										</TextField>

										<TextField
											type='text'
											defaultValue={book?.author}
											className='grid'
										>
											<Label className='font-semibold'>
												{t('books.dialog.author-label')}
											</Label>
											<Input
												name='author'
												className='rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'
											/>
										</TextField>

										<TextField
											type='text'
											defaultValue={String(book?.year || '')}
											className='grid'
										>
											<Label className='font-semibold'>
												{t('books.dialog.year-label')}
											</Label>
											<Input
												name='year'
												className='rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'
											/>
										</TextField>
									</div>
								</div>

								{error && (
									<div className='mt-4 p-2 bg-red-100 text-red-700 rounded border border-red-300'>
										{error}
									</div>
								)}
							</div>

							{/* Dialog Buttons */}
							<div className='bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6'>
								<Button
									type='submit'
									isDisabled={isPending}
									className='inline-flex w-full cursor-pointer justify-center items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 sm:ml-3 sm:w-auto'
								>
									{isPending ? (
										<svg className='w-4 h-4 animate-spin' aria-hidden='true'>
											<use xlinkHref='#loading' />
										</svg>
									) : null}
									{isEditing
										? t('books.dialog.update')
										: t('books.dialog.create')}
								</Button>

								<Button
									type='button'
									isDisabled={isPending}
									onPress={closeDialog}
									className='mt-3 inline-flex w-full cursor-pointer justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto'
								>
									{t('books.dialog.cancel')}
								</Button>
							</div>
						</form>
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	);
}
