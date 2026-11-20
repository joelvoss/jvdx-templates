import { Link } from "@tanstack/react-router";
import type * as v from "valibot";

import type {
	Book,
	CreateBookSchema,
	UpdateBookSchema,
} from "~/features/books/schema";
import { FormField } from "~/shared/form-field";
import { useTranslations } from "~/shared/i18n";

////////////////////////////////////////////////////////////////////////////////

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
	issues?:
		| v.FlatErrors<typeof CreateBookSchema>
		| v.FlatErrors<typeof UpdateBookSchema>;
	globalErrorTitle: string;
	submitLabel: string;
	isPending: boolean;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	cancelTo: "/{-$locale}/books" | "/{-$locale}/books/$id";
}

////////////////////////////////////////////////////////////////////////////////

export function BookForm(props: BookFormProps) {
	const t = useTranslations("routes.books.form");
	const currentYear = new Date().getFullYear();
	const fieldIssues = props.issues?.nested;
	const globalErrors = props.issues?.root;

	return (
		<>
			{globalErrors?.length ? (
				<div
					role="alert"
					className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
				>
					<p className="font-medium">{props.globalErrorTitle}</p>
					<ul className="mt-2 list-disc space-y-1 pl-5">
						{globalErrors.map((message, index) => (
							<li key={index}>{message}</li>
						))}
					</ul>
				</div>
			) : null}

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
					issue={fieldIssues?.title ? t("validation.titleMin") : undefined}
				/>
				<FormField
					name="author"
					label={t("fields.author")}
					required
					defaultValue={props.book?.author}
					issue={fieldIssues?.author ? t("validation.authorMin") : undefined}
				/>
				<FormField
					name="isbn"
					label={t("fields.isbn")}
					required
					placeholder={t("placeholders.isbn")}
					defaultValue={props.book?.isbn}
					issue={fieldIssues?.isbn ? t("validation.isbnInvalid") : undefined}
				/>
				<FormField
					name="publishedYear"
					label={t("fields.publishedYear")}
					required
					type="number"
					min="1000"
					max={currentYear}
					defaultValue={props.book?.publishedYear}
					issue={
						fieldIssues?.publishedYear
							? t("validation.publishedYearRange", { year: currentYear })
							: undefined
					}
				/>
				<FormField
					name="description"
					label={t("fields.description")}
					type="textarea"
					rows={4}
					defaultValue={props.book?.description}
					issue={
						fieldIssues?.description
							? t("validation.descriptionMin")
							: undefined
					}
				/>
				<FormField
					name="coverImageUrl"
					label={t("fields.coverImageUrl")}
					placeholder={t("placeholders.coverImageUrl")}
					defaultValue={props.book?.coverImageUrl}
					issue={
						fieldIssues?.coverImageUrl
							? t("validation.coverImageUrlInvalid")
							: undefined
					}
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
		</>
	);
}
