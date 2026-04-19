import { createFileRoute, Link } from "@tanstack/react-router";

import { useTranslations } from "~/shared/i18n";

////////////////////////////////////////////////////////////////////////////////

export const Route = createFileRoute("/{-$locale}/")({
	component: RouteComponent,
});

////////////////////////////////////////////////////////////////////////////////

function RouteComponent() {
	const t = useTranslations("routes.home");

	return (
		<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="text-center">
				<h1 className="mb-4 text-4xl font-bold text-gray-900">{t("title")}</h1>
				<p className="mb-8 text-xl text-gray-600">{t("subtitle")}</p>
				<div className="flex justify-center gap-4">
					<Link
						to="/{-$locale}/books"
						className="rounded-lg bg-sky-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-sky-700"
					>
						{t("viewBooks")}
					</Link>
					<Link
						to="/{-$locale}/books/new"
						className="rounded-lg bg-gray-200 px-6 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-300"
					>
						{t("addNewBook")}
					</Link>
				</div>
			</div>
		</div>
	);
}
