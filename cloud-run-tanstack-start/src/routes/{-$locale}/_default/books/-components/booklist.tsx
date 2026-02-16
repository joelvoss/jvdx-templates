import { useSuspenseQuery } from "@tanstack/react-query";

import { ErrorComponentProps } from "~/shared/error-boundary";
import { useTranslations } from "~/shared/i18n";
import { LocalizedLink } from "~/shared/localized-link";

import { Route } from "..";
import { booksQueryOptions } from "../-queries";

////////////////////////////////////////////////////////////////////////////////

/**
 * Book list loading skeloton.
 */
export function BookListSkeleton() {
	const cards = 3;

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: cards }).map((_, index) => (
				<div
					key={index}
					className="animate-pulse overflow-hidden rounded-lg bg-white shadow-md"
				>
					<div className="p-6">
						{/* Title */}
						<div className="mb-2 h-6 w-3/4 rounded bg-gray-300"></div>
						{/* Author */}
						<div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
						{/* ISBN */}
						<div className="mb-3 h-3 w-2/3 rounded bg-gray-200"></div>
						{/* Description */}
						<div className="space-y-2">
							<div className="h-3 w-full rounded bg-gray-200"></div>
							<div className="h-3 w-full rounded bg-gray-200"></div>
							<div className="h-3 w-3/4 rounded bg-gray-200"></div>
						</div>
						{/* Footer */}
						<div className="mt-4 border-t border-gray-200 pt-4">
							<div className="h-3 w-1/3 rounded bg-gray-200"></div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Book list empty state.
 */
function BookListEmpty() {
	const t = useTranslations("routes.books.list");

	return (
		<div className="rounded-lg bg-white py-12 text-center shadow">
			<p className="mb-4 text-lg text-gray-500">{t("empty")}</p>
			<LocalizedLink
				to="/books/new"
				className="text-sky-600 underline hover:text-sky-700"
			>
				{t("addFirst")}
			</LocalizedLink>
		</div>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Book list error state.
 */
export function BookListError(props: ErrorComponentProps) {
	const { error } = props;
	const t = useTranslations("routes.books.list");

	return (
		<div className="rounded-lg bg-white py-6 text-center shadow">
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

////////////////////////////////////////////////////////////////////////////////

/**
 * Books list component.
 */
export function BooksList() {
	const { sort } = Route.useSearch();
	const booksQuery = useSuspenseQuery(booksQueryOptions({ sort }));
	const t = useTranslations("routes.books.list");

	const bookList = booksQuery.data;

	if (bookList.length === 0) {
		return <BookListEmpty />;
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{bookList.map((book) => (
				<LocalizedLink
					key={book.id}
					to="/books/$id"
					params={{ id: book.id }}
					className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
				>
					<div className="p-6">
						{/* Title */}
						<h2 className="mb-2 text-xl font-semibold text-gray-900">
							{book.title}
						</h2>
						{/* Author */}
						<p className="mb-2 text-gray-600">{book.author}</p>
						{/* ISBN */}
						<p className="mb-3 text-sm text-gray-500">
							{t("isbnPrefix")} {book.isbn}
						</p>
						{/* Description */}
						{book.description ? (
							<p className="line-clamp-3 text-sm text-gray-700">
								{book.description}
							</p>
						) : null}
						{/* Footer */}
						<div className="mt-4 border-t border-gray-200 pt-4">
							<span className="text-xs text-gray-500">
								{t("publishedPrefix")} {book.publishedYear}
							</span>
						</div>
					</div>
				</LocalizedLink>
			))}
		</div>
	);
}
