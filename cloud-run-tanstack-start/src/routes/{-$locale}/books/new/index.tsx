import { createFileRoute, Link } from "@tanstack/react-router";

import { useTranslations } from "~/shared/i18n";
import { translations } from "~/shared/i18n";

import { NewBook } from "./-components/new-book";

export const Route = createFileRoute("/{-$locale}/books/new/")({
	component: RouteComponent,
	head: (ctx) => {
		const { i18n } = ctx.match.context;
		const t = translations(i18n.messages, i18n.locale, "head");
		return {
			meta: [{ title: t("title.newBook") }],
		};
	},
});

function RouteComponent() {
	const t = useTranslations("routes.books");

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-6">
				<Link
					to="/{-$locale}/books"
					className="text-sm text-sky-600 hover:text-sky-700"
				>
					{t("backToBooks")}
				</Link>
			</div>

			<NewBook />
		</div>
	);
}
