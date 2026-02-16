import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ErrorComponentProps } from "~/shared/error-boundary";
import { useTranslations } from "~/shared/i18n";
import { LocalizedLink } from "~/shared/localized-link";

import { Route } from "..";
import { bookQueryOptions } from "../-queries";

////////////////////////////////////////////////////////////////////////////////

/**
 * Book Component.
 * Displays detailed information about a book.
 */
export function Book() {
	const { id } = Route.useParams();
	const { data } = useSuspenseQuery(bookQueryOptions({ id }));
	const t = useTranslations("routes.books.details");

	return (
		<div className="overflow-hidden rounded-lg bg-white shadow-md">
			<div className="p-8">
				<BookHeader />

				<div className="space-y-4">
					<div>
						<h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
							{t("author")}
						</h2>
						<p className="mt-1 text-lg text-gray-900">{data.author}</p>
					</div>

					<div>
						<h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
							{t("isbn")}
						</h2>
						<p className="mt-1 font-mono text-lg text-gray-900">{data.isbn}</p>
					</div>

					<div>
						<h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
							{t("publishedYear")}
						</h2>
						<p className="mt-1 text-lg text-gray-900">{data.publishedYear}</p>
					</div>

					{data.description ? (
						<div>
							<h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
								{t("description")}
							</h2>
							<p className="mt-1 leading-relaxed text-gray-700">
								{data.description}
							</p>
						</div>
					) : null}

					{data.coverImageUrl ? (
						<div>
							<h2 className="mb-2 text-sm font-medium tracking-wide text-gray-500 uppercase">
								{t("coverImage")}
							</h2>
							<img
								src={data.coverImageUrl}
								alt={t("coverAlt", { title: data.title })}
								className="max-w-xs rounded-lg shadow-md"
							/>
						</div>
					) : null}
				</div>

				<BookMetadata />
			</div>
		</div>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Book Header Component.
 * Displays the book title and action buttons.
 */
export function BookHeader() {
	const { id } = Route.useParams();
	const { data } = useSuspenseQuery(bookQueryOptions({ id }));
	const t = useTranslations("routes.books.details");

	return (
		<div className="mb-6 flex items-start justify-between">
			<h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
			<div className="flex gap-2">
				<LocalizedLink
					to="/books/$id/edit"
					params={{ id: data.id }}
					className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white transition-colors hover:bg-sky-700"
				>
					{t("edit")}
				</LocalizedLink>
				<LocalizedLink
					from={Route.fullPath}
					search={{ modal: "delete" }} // NOTE(joel): Show delete dialog
					className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
				>
					{t("delete")}
				</LocalizedLink>
			</div>
		</div>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Book Metadata Component.
 * Displays creation and last updated dates.
 */
export function BookMetadata() {
	const { id } = Route.useParams();
	const { data } = useSuspenseQuery(bookQueryOptions({ id }));

	const [isClient, setIsClient] = useState(false);
	const t = useTranslations("routes.books.details");

	useEffect(() => {
		setIsClient(true);
	}, []);

	const formatDate = (date: Date) => {
		if (isClient) {
			return new Date(date).toLocaleDateString();
		}
		return new Date(date).toISOString().split("T")[0];
	};

	return (
		<div className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-500">
			<p>{t("created", { date: formatDate(data.createdAt) })}</p>
			<p>{t("updated", { date: formatDate(data.updatedAt) })}</p>
		</div>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Book Skeleton Component.
 * Displays a loading skeleton while book details are being fetched.
 */
export function BookSkeleton() {
	return (
		<div className="overflow-hidden rounded-lg bg-white shadow-md">
			<div className="animate-pulse p-8">
				{/* Header with Actions */}
				<div className="mb-6 flex items-start justify-between">
					<div className="h-8 w-1/2 rounded bg-gray-300"></div>
					<div className="flex gap-2">
						<div className="h-10 w-16 rounded bg-gray-200"></div>
						<div className="h-10 w-20 rounded bg-gray-200"></div>
					</div>
				</div>

				{/* Book Details */}
				<div className="space-y-6">
					{/* Author */}
					<div>
						<div className="mb-2 h-3 w-16 rounded bg-gray-200"></div>
						<div className="h-6 w-48 rounded bg-gray-300"></div>
					</div>

					{/* ISBN */}
					<div>
						<div className="mb-2 h-3 w-16 rounded bg-gray-200"></div>
						<div className="h-6 w-64 rounded bg-gray-300"></div>
					</div>

					{/* Published Year */}
					<div>
						<div className="mb-2 h-3 w-24 rounded bg-gray-200"></div>
						<div className="h-6 w-24 rounded bg-gray-300"></div>
					</div>

					{/* Description */}
					<div>
						<div className="mb-2 h-3 w-20 rounded bg-gray-200"></div>
						<div className="space-y-2">
							<div className="h-4 w-full rounded bg-gray-200"></div>
							<div className="h-4 w-full rounded bg-gray-200"></div>
							<div className="h-4 w-3/4 rounded bg-gray-200"></div>
						</div>
					</div>
				</div>

				{/* Metadata */}
				<div className="mt-8 border-t border-gray-200 pt-6">
					<div className="mb-2 h-3 w-48 rounded bg-gray-200"></div>
					<div className="h-3 w-48 rounded bg-gray-200"></div>
				</div>
			</div>
		</div>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Book Error Component.
 * Displays an error message when book details fail to load.
 */
export function BookError(props: ErrorComponentProps) {
	const { error } = props;
	const t = useTranslations("routes.books.details");

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
