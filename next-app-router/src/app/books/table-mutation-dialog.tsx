'use client';

import { useState } from 'react';
import {
	Button,
	Dialog,
	Heading,
	Input,
	Label,
	Modal,
	ModalOverlay,
	TextField,
} from 'react-aria-components';
import { useI18n } from '@/lib/i18n/client';
import type { Book } from './actions';

interface TableMutationDialogProps {
	book: Book | 'new' | null;
	onClose: () => void;
	onSubmit: (book: Omit<Book, 'id'> | Book) => void;
}

/**
 * Renders the shared create and edit form for a book.
 * A null book closes the dialog, "new" opens create mode, and an existing
 * book opens edit mode.
 */
export function TableMutationDialog({
	book,
	onClose,
	onSubmit,
}: TableMutationDialogProps) {
	const t = useI18n();
	const [isSaving, setIsSaving] = useState(false);

	const submit = (event: React.SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isSaving) return;

		const data = new FormData(event.currentTarget);
		setIsSaving(true);
		const values = {
			title: String(data.get('title')),
			author: String(data.get('author')),
			year: Number(data.get('year')),
		};
		onSubmit(book === 'new' ? values : { ...book, ...values });
		setIsSaving(false);
	};

	return (
		<ModalOverlay
			isOpen={book !== null}
			onOpenChange={open => {
				if (!open) onClose();
			}}
			className='fixed inset-0 z-10 flex items-center justify-center bg-gray-950/40 p-4'
		>
			<Modal className='w-full max-w-md rounded-xl bg-white shadow-xl'>
				<Dialog className='outline-none'>
					<form onSubmit={submit}>
						<div className='p-6'>
							<Heading slot='title' className='text-xl font-bold text-gray-950'>
								{book !== 'new'
									? t('books.dialog.edit-title')
									: t('books.dialog.create-title')}
							</Heading>
							<p className='mt-1 text-sm text-gray-500'>
								{book !== 'new'
									? t('books.dialog.edit-desc')
									: t('books.dialog.create-desc')}
							</p>

							<div className='mt-6 grid gap-4'>
								<BookField
									name='title'
									label={t('books.dialog.title-label')}
									value={book === 'new' ? undefined : book?.title}
								/>
								<BookField
									name='author'
									label={t('books.dialog.author-label')}
									value={book === 'new' ? undefined : book?.author}
								/>
								<BookField
									name='year'
									label={t('books.dialog.year-label')}
									type='number'
									value={book === 'new' ? undefined : book?.year}
								/>
							</div>
						</div>
						<div className='flex justify-end gap-3 rounded-b-xl bg-gray-50 px-6 py-4'>
							<Button
								type='button'
								onPress={onClose}
								isDisabled={isSaving}
								className='rounded-lg px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200'
							>
								{t('books.dialog.cancel')}
							</Button>
							<Button
								type='submit'
								isDisabled={isSaving}
								className='rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60'
							>
								{book !== 'new'
									? t('books.dialog.update')
									: t('books.dialog.create')}
							</Button>
						</div>
					</form>
				</Dialog>
			</Modal>
		</ModalOverlay>
	);
}

function BookField({
	name,
	label,
	type = 'text',
	value,
}: {
	name: string;
	label: string;
	type?: string;
	value?: string | number;
}) {
	return (
		<TextField
			name={name}
			isRequired
			defaultValue={value == null ? '' : String(value)}
		>
			<Label className='mb-1 block text-sm font-semibold text-gray-700'>
				{label}
			</Label>
			<Input
				type={type}
				className='w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
			/>
		</TextField>
	);
}
