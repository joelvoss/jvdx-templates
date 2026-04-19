import { useMutation } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { createBookMutationOpts } from "~/features/books/client";
import { useTranslations } from "~/shared/i18n";
import { toastQueue } from "~/shared/toast";

import { BookForm } from "../../-components/book-form";

////////////////////////////////////////////////////////////////////////////////

const Route = getRouteApi("/{-$locale}/books/new/");

////////////////////////////////////////////////////////////////////////////////

/**
 * New Book Component.
 * Displays a form to create a new book.
 */
export function NewBook() {
	const t = useTranslations("routes.books.form");
	const navigate = Route.useNavigate();

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
				void navigate({ to: "/{-$locale}/books" });
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
	const currentYear = new Date().getFullYear();

	return (
		<>
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

			<BookForm
				onSubmit={handleSubmit}
				isPending={isPending}
				submitLabel={t("actions.create")}
				cancelTo="/{-$locale}/books"
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
		</>
	);
}
