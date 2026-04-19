import { Link } from "@tanstack/react-router";

import type { Book } from "~/features/books/schema";
import { FormField } from "~/shared/form-field";
import { useTranslations } from "~/shared/i18n";

////////////////////////////////////////////////////////////////////////////////

type BookFormIssues = {
	title?: string;
	author?: string;
	isbn?: string;
	publishedYear?: string;
	description?: string;
	coverImageUrl?: string;
};

interface BookFormProps {
	id?: string;
	book?: Pick<
		Book,
		| "id"
		| "title"
		| "author"
		| "isbn"
		| "publishedYear"
		| "description"
		| "coverImageUrl"
	>;
	issues?: BookFormIssues;
	submitLabel: string;
	isPending: boolean;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	cancelTo: "/{-$locale}/books" | "/{-$locale}/books/$id";
}

////////////////////////////////////////////////////////////////////////////////

export function BookForm(props: BookFormProps) {
	const t = useTranslations("routes.books.form");
	const currentYear = new Date().getFullYear();

	return (
		<form
			className="space-y-6 rounded-lg bg-white p-6 shadow-md"
			onSubmit={props.onSubmit}
		>
			{props.book?.id ? (
				<input type="hidden" name="id" value={props.book.id} />
			) : null}

			<FormField
				name="title"
				label={t("fields.title")}
				required
				defaultValue={props.book?.title}
				issue={props.issues?.title}
			/>
			<FormField
				name="author"
				label={t("fields.author")}
				required
				defaultValue={props.book?.author}
				issue={props.issues?.author}
			/>
			<FormField
				name="isbn"
				label={t("fields.isbn")}
				required
				placeholder={t("placeholders.isbn")}
				defaultValue={props.book?.isbn}
				issue={props.issues?.isbn}
			/>
			<FormField
				name="publishedYear"
				label={t("fields.publishedYear")}
				required
				type="number"
				min="1000"
				max={currentYear}
				defaultValue={props.book?.publishedYear}
				issue={props.issues?.publishedYear}
			/>
			<FormField
				name="description"
				label={t("fields.description")}
				type="textarea"
				rows={4}
				defaultValue={props.book?.description}
				issue={props.issues?.description}
			/>
			<FormField
				name="coverImageUrl"
				label={t("fields.coverImageUrl")}
				placeholder={t("placeholders.coverImageUrl")}
				defaultValue={props.book?.coverImageUrl}
				issue={props.issues?.coverImageUrl}
			/>

			<div className="flex gap-4">
				<button
					type="submit"
					disabled={props.isPending}
					className="flex-1 cursor-pointer rounded-lg bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					{props.isPending ? t("actions.saving") : props.submitLabel}
				</button>

				{props.cancelTo === "/{-$locale}/books/$id" ? (
					<Link
						to="/{-$locale}/books/$id"
						params={{ id: props.id! }}
						className="flex-1 rounded-lg bg-gray-200 px-6 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-300"
					>
						{t("actions.cancel")}
					</Link>
				) : (
					<Link
						to="/{-$locale}/books"
						className="flex-1 rounded-lg bg-gray-200 px-6 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-300"
					>
						{t("actions.cancel")}
					</Link>
				)}
			</div>
		</form>
	);
}
