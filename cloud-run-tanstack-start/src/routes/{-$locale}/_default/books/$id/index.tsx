import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import * as v from "valibot";

import { translations } from "~/lib/i18n";
import { ErrorBoundary } from "~/shared/error-boundary";
import { useTranslations } from "~/shared/i18n";
import { LocalizedLink } from "~/shared/localized-link";

import { Book, BookError, BookSkeleton } from "./-components/book";
import { BookDeleteDialog } from "./-components/book-delete-dialog";

////////////////////////////////////////////////////////////////////////////////

const BookSchema = v.object({
	modal: v.optional(v.picklist(["delete"])),
});

export const Route = createFileRoute("/{-$locale}/_default/books/$id/")({
	component: RouteComponent,
	// NOTE(joel): Validate 'search' params (which also types it for us).
	validateSearch: BookSchema,
	head: (ctx) => {
		const { i18n } = ctx.match.context;
		const t = translations(i18n.messages, i18n.locale, "head");
		return {
			meta: [{ title: t("title.bookDetails") }],
		};
	},
});

////////////////////////////////////////////////////////////////////////////////

function RouteComponent() {
	const t = useTranslations("routes.books");

	return (
		<>
			<div className="mb-6">
				<LocalizedLink
					to="/books"
					className="text-sm text-sky-600 hover:text-sky-700"
				>
					{t("backToBooks")}
				</LocalizedLink>
			</div>

			<ErrorBoundary fallback={BookError}>
				<Suspense fallback={<BookSkeleton />}>
					<Book />
					<BookDeleteDialog />
				</Suspense>
			</ErrorBoundary>
		</>
	);
}
