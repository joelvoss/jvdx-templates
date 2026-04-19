import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import * as v from "valibot";

import { ErrorBoundary } from "~/shared/error-boundary";
import { useTranslations } from "~/shared/i18n";
import { translations } from "~/shared/i18n";

import { Book, BookError, BookSkeleton } from "./-components/book";
import { BookDeleteDialog } from "./-components/book-delete-dialog";

////////////////////////////////////////////////////////////////////////////////

const BookDetailsSearchSchema = v.object({
	modal: v.optional(v.picklist(["delete"])),
});

export const Route = createFileRoute("/{-$locale}/books/$id/")({
	component: RouteComponent,
	// NOTE(joel): Validate 'search' params (which also types it for us).
	validateSearch: BookDetailsSearchSchema,
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
				<Link
					to="/{-$locale}/books"
					className="text-sm text-sky-600 hover:text-sky-700"
				>
					{t("backToBooks")}
				</Link>
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
