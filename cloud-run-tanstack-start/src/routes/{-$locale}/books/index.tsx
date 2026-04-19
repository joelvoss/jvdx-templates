import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";

import { booksQueryOptions } from "~/features/books/client";
import { GetBooksSchema } from "~/features/books/schema";
import { ErrorBoundary } from "~/shared/error-boundary";
import { useTranslations } from "~/shared/i18n";
import { translations } from "~/shared/i18n";

import {
	BookListError,
	BookListSkeleton,
	BooksList,
} from "./-components/booklist";
import { BookListSort } from "./-components/booklist-sort";

////////////////////////////////////////////////////////////////////////////////

export const Route = createFileRoute("/{-$locale}/books/")({
	component: RouteComponent,
	// NOTE(joel): Validate 'search' params (which also types it for us).
	validateSearch: GetBooksSchema,
	// NOTE(joel): Surface 'search' params as loader 'deps'.
	loaderDeps: ({ search }) => ({ sort: search.sort }),
	// NOTE(joel): Prefetch books based on 'search' params.
	loader: ({ context, deps }) => {
		void context.queryClient.prefetchQuery(
			booksQueryOptions({ sort: deps.sort }),
		);
	},
	head: (ctx) => {
		const { i18n } = ctx.match.context;
		const t = translations(i18n.messages, i18n.locale, "head");
		return {
			meta: [{ title: t("title.books") }],
		};
	},
});

////////////////////////////////////////////////////////////////////////////////

function RouteComponent() {
	const t = useTranslations("routes.books");
	const { sort } = Route.useSearch();

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
				<Link
					to="/{-$locale}/books/new"
					className="rounded-lg bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-700"
				>
					{t("addNewBook")}
				</Link>
			</div>

			<BookListSort />

			<ErrorBoundary fallback={BookListError} getResetKey={() => sort}>
				<Suspense fallback={<BookListSkeleton />}>
					<BooksList />
				</Suspense>
			</ErrorBoundary>
		</div>
	);
}
