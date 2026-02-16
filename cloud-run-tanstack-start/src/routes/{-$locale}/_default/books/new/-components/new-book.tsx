import { useMutation } from "@tanstack/react-query";

import { useLocalizedNavigate } from "~/hooks/use-localized-navigate";
import { clsx } from "~/lib/clsx";
import { useTranslations } from "~/shared/i18n";
import { LocalizedLink } from "~/shared/localized-link";
import { Textarea } from "~/shared/textarea";
import { toastQueue } from "~/shared/toast";

import { Route } from "..";
import { createBookMutationOpts } from "../-mutations";

////////////////////////////////////////////////////////////////////////////////

/**
 * New Book Component.
 * Displays a form to create a new book.
 */
export function NewBook() {
	const t = useTranslations("routes.books.form");
	const navigate = useLocalizedNavigate({ from: Route.fullPath });

	const { mutate, isPending, error } = useMutation(
		createBookMutationOpts({
			onSuccess: () => {
				toastQueue.add(
					{
						title: t("toasts.createdTitle"),
						description: t("toasts.createdDescription"),
					},
					{ timeout: 5000 },
				);
				void navigate({ to: "/books" });
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		e.stopPropagation();
		const data = new FormData(e.currentTarget);
		mutate(data);
	};

	const fieldIssues = error?.issues?.nested;
	const globalErrors = error?.issues?.root;

	return (
		<form
			className="space-y-6 rounded-lg bg-white p-6 shadow-md"
			onSubmit={handleSubmit}
		>
			{globalErrors ? (
				<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
					<p className="font-medium">{t("globalErrorTitle")}</p>
					<ul className="mt-2 list-disc space-y-1 pl-5">
						{globalErrors.map((e, i) => (
							<li key={i}>{e}</li>
						))}
					</ul>
				</div>
			) : null}

			{/* Title */}
			<FormField
				name="title"
				label={t("fields.title")}
				required
				issue={fieldIssues?.title && t("validation.titleMin")}
			/>
			{/* Author */}
			<FormField
				name="author"
				label={t("fields.author")}
				required
				issue={fieldIssues?.author && t("validation.authorMin")}
			/>
			{/* ISBN */}
			<FormField
				name="isbn"
				label={t("fields.isbn")}
				required
				placeholder={t("placeholders.isbn")}
				issue={fieldIssues?.isbn && t("validation.isbnInvalid")}
			/>
			{/* Publish Year */}
			<FormField
				name="publishedYear"
				label={t("fields.publishedYear")}
				required
				type="number"
				min="1000"
				max={new Date().getFullYear()}
				issue={
					fieldIssues?.publishedYear &&
					t("validation.publishedYearRange", {
						year: new Date().getFullYear(),
					})
				}
			/>
			{/* Description */}
			<FormField
				name="description"
				label={t("fields.description")}
				type="textarea"
				rows={4}
				issue={fieldIssues?.description && t("validation.descriptionMin")}
			/>
			{/* Cover Image URL */}
			<FormField
				name="coverImageUrl"
				label={t("fields.coverImageUrl")}
				placeholder={t("placeholders.coverImageUrl")}
				issue={
					fieldIssues?.coverImageUrl && t("validation.coverImageUrlInvalid")
				}
			/>

			{/* Submit */}
			<div className="flex gap-4">
				<button
					type="submit"
					disabled={!!isPending}
					className="flex-1 cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					{isPending ? t("actions.saving") : t("actions.create")}
				</button>

				<LocalizedLink
					to="/books"
					className="flex-1 rounded-lg bg-gray-200 px-6 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-300"
				>
					{t("actions.cancel")}
				</LocalizedLink>
			</div>
		</form>
	);
}

////////////////////////////////////////////////////////////////////////////////

type FormFieldProps = React.InputHTMLAttributes<HTMLInputElement> &
	React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
		name: string;
		label: string;
		type?: string;
		issue?: string;
	};

/**
 * Form Field Component.
 * Renders a labeled input or textarea with validation error display.
 */
export function FormField(props: FormFieldProps) {
	const id = props.id || props.name;
	const required = props.required || false;
	const type = props.type || "text";

	return (
		<div>
			<label
				htmlFor={props.name}
				className="mb-2 block text-sm font-medium text-gray-700"
			>
				{props.label}
				{required ? <span className="text-red-500">*</span> : null}
			</label>

			{type === "textarea" ? (
				<Textarea
					name={props.name}
					id={id}
					required={required}
					minRows={props.rows}
					maxRows={props.rows ? props.rows * 2 : undefined}
					placeholder={props.placeholder}
					className={clsx(
						"w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
						props.issue ? "border-red-500" : null,
					)}
				></Textarea>
			) : (
				<input
					type={type}
					name={props.name}
					id={id}
					required={required}
					placeholder={props.placeholder}
					min={props.min}
					max={props.max}
					className={clsx(
						"w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
						props.issue ? "border-red-500" : null,
					)}
				/>
			)}

			{props.issue ? (
				<p className="mt-1 text-sm text-red-600">{props.issue}</p>
			) : null}
		</div>
	);
}
