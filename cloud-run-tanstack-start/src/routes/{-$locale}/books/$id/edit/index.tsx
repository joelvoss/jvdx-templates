import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";

import { ErrorBoundary } from "~/shared/error-boundary";
import { useTranslations } from "~/shared/i18n";
import { translations } from "~/shared/i18n";

import {
	EditBook,
	EditBookError,
	EditBookSkeleton,
} from "./-components/edit-book";

////////////////////////////////////////////////////////////////////////////////

export const Route = createFileRoute("/{-$locale}/books/$id/edit/")({
	component: RouteComponent,
	head: (ctx) => {
		const { i18n } = ctx.match.context;
		const t = translations(i18n.messages, i18n.locale, "head");
		return {
			meta: [{ title: t("title.editBook") }],
		};
	},
});

function RouteComponent() {
	const { id } = Route.useParams();
	const t = useTranslations("routes.books");

	return (
		<>
			<div className="mb-6">
				<Link
					to="/{-$locale}/books/$id"
					params={{ id }}
					className="text-sm text-sky-600 hover:text-sky-700"
				>
					{t("backToBook")}
				</Link>
			</div>
			<h1 className="mb-8 text-3xl font-bold text-gray-900">
				{t("editPageTitle")}
			</h1>

			<ErrorBoundary fallback={EditBookError}>
				<Suspense fallback={<EditBookSkeleton />}>
					<EditBook />
				</Suspense>
			</ErrorBoundary>
		</>
	);
}
