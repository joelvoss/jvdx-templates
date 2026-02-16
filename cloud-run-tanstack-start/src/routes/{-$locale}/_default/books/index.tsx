import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { GetBooksSchema } from "~/adapter/firestore";
import { translations } from "~/lib/i18n";
import { ErrorBoundary } from "~/shared/error-boundary";
import { useTranslations } from "~/shared/i18n";
import { LocalizedLink } from "~/shared/localized-link";

import {
	BookListError,
	BookListSkeleton,
	BooksList,
} from "./-components/booklist";
import { BookListSort } from "./-components/booklist-sort";
import { booksQueryOptions } from "./-queries";

////////////////////////////////////////////////////////////////////////////////

export const Route = createFileRoute("/{-$locale}/_default/books/")({
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
				<LocalizedLink
					to="/books/new"
					className="rounded-lg bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-700"
				>
					{t("addNewBook")}
				</LocalizedLink>
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
