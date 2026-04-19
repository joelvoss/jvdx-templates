import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import {
	bookQueryOptions,
	updateBookMutationOpts,
} from "~/features/books/client";
import { ErrorComponentProps } from "~/shared/error-boundary";
import { useTranslations } from "~/shared/i18n";
import { toastQueue } from "~/shared/toast";

import { BookForm } from "../../../-components/book-form";

////////////////////////////////////////////////////////////////////////////////

const Route = getRouteApi("/{-$locale}/books/$id/edit/");

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
	const currentYear = new Date().getFullYear();

	return (
		<BookForm
			id={id}
			book={data}
			onSubmit={handleSubmit}
			isPending={isPending}
			submitLabel={t("actions.save")}
			cancelTo="/{-$locale}/books/$id"
			issues={{
				title: fieldIssues?.title ? t("validation.titleMin") : undefined,
				author: fieldIssues?.author ? t("validation.authorMin") : undefined,
				isbn: fieldIssues?.isbn ? t("validation.isbnInvalid") : undefined,
				publishedYear: fieldIssues?.publishedYear
					? t("validation.publishedYearRange", { year: currentYear })
					: undefined,
				description: fieldIssues?.description
					? t("validation.descriptionMin")
					: undefined,
				coverImageUrl: fieldIssues?.coverImageUrl
					? t("validation.coverImageUrlInvalid")
					: undefined,
			}}
		/>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Edit Book Skeleton Component.
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
