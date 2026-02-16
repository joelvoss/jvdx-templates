import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { clsx } from "~/lib/clsx";
import { ErrorComponentProps } from "~/shared/error-boundary";
import { useTranslations } from "~/shared/i18n";
import { LocalizedLink } from "~/shared/localized-link";
import { Textarea } from "~/shared/textarea";
import { toastQueue } from "~/shared/toast";

import { Route } from "..";
import { updateBookMutationOpts } from "../-mutations";
import { bookQueryOptions } from "../../-queries";

////////////////////////////////////////////////////////////////////////////////

/**
 * Edit Book Component.
 * Displays a form to edit book details.
 */
export function EditBook() {
	const { id } = Route.useParams();
	const { data } = useSuspenseQuery(bookQueryOptions({ id }));
	const t = useTranslations("routes.books.form");

	const { mutate, isPending, error } = useMutation(
		updateBookMutationOpts({
			id,
			onSuccess: () => {
				toastQueue.add(
					{
						title: t("toasts.updatedTitle"),
						description: t("toasts.updatedDescription"),
					},
					{ timeout: 5000 },
				);
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

	return (
		<form
			className="space-y-6 rounded-lg bg-white p-6 shadow-md"
			onSubmit={handleSubmit}
		>
			{/* Hidden ID field */}
			<input type="hidden" name="id" value={data.id} />

			{/* Title */}
			<FormField
				name="title"
				label={t("fields.title")}
				required
				defaultValue={data.title}
				issue={fieldIssues?.title && t("validation.titleMin")}
			/>
			{/* Author */}
			<FormField
				name="author"
				label={t("fields.author")}
				required
				defaultValue={data.author}
				issue={fieldIssues?.author && t("validation.authorMin")}
			/>
			{/* ISBN */}
			<FormField
				name="isbn"
				label={t("fields.isbn")}
				required
				placeholder={t("placeholders.isbn")}
				defaultValue={data.isbn}
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
				defaultValue={data.publishedYear}
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
				defaultValue={data.description}
				issue={fieldIssues?.description && t("validation.descriptionMin")}
			/>
			{/* Cover Image URL */}
			<FormField
				name="coverImageUrl"
				label={t("fields.coverImageUrl")}
				placeholder={t("placeholders.coverImageUrl")}
				defaultValue={data.coverImageUrl}
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
					{isPending ? t("actions.saving") : t("actions.save")}
				</button>

				<LocalizedLink
					to="/books/$id"
					params={{ id }}
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
					defaultValue={props.defaultValue}
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
					defaultValue={props.defaultValue}
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

////////////////////////////////////////////////////////////////////////////////

/**
 * Book Skeleton Component.
 * Displays a loading skeleton while book details are being fetched.
 */
export function EditBookSkeleton() {
	return (
		<div className="space-y-8 rounded-lg bg-white p-6 shadow-md">
			<div className="animate-pulse space-y-9">
				{/* Title */}
				<div>
					<div className="mb-2 h-4 w-16 rounded bg-gray-200"></div>
					<div className="h-10 w-full rounded bg-gray-300"></div>
				</div>

				{/* Author */}
				<div>
					<div className="mb-2 h-3 w-20 rounded bg-gray-200"></div>
					<div className="h-10 w-full rounded bg-gray-300"></div>
				</div>

				{/* ISBN */}
				<div>
					<div className="mb-2 h-3 w-16 rounded bg-gray-200"></div>
					<div className="h-10 w-full rounded bg-gray-300"></div>
				</div>

				{/* Published Year */}
				<div>
					<div className="mb-2 h-3 w-24 rounded bg-gray-200"></div>
					<div className="h-10 w-full rounded bg-gray-300"></div>
				</div>

				{/* Description */}
				<div>
					<div className="mb-2 h-3 w-24 rounded bg-gray-200"></div>
					<div className="h-24 w-full rounded bg-gray-300"></div>
				</div>

				{/* Cover Image URL */}
				<div>
					<div className="mb-2 h-3 w-32 rounded bg-gray-200"></div>
					<div className="h-10 w-full rounded bg-gray-300"></div>
				</div>

				{/* Actions */}
				<div className="flex gap-4">
					<div className="h-10 flex-1 rounded bg-gray-300"></div>
					<div className="h-10 flex-1 rounded bg-gray-200"></div>
				</div>
			</div>
		</div>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Edit Book Error Component.
 * Displays an error message when book details fail to load.
 */
export function EditBookError(props: ErrorComponentProps) {
	const { error } = props;
	const t = useTranslations("routes.books.details");

	return (
		<div className="space-y-6 rounded-lg bg-white p-6 shadow-md py-6 text-center">
			<p className="text-lg text-gray-500">{t("errorTitle")}</p>
			<p className="text-sm text-gray-400">{t("errorSubtitle")}</p>
			{error ? (
				<p className="mt-4 text-sm text-gray-400">
					{t("errorMessageLabel")}{" "}
					<code className="rounded py-0.5 px-1 border border-gray-200">
						{error.message}
					</code>
				</p>
			) : null}
		</div>
	);
}
