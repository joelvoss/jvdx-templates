import { createFileRoute } from "@tanstack/react-router";

import { translations } from "~/lib/i18n";
import { useTranslations } from "~/shared/i18n";

export const Route = createFileRoute("/{-$locale}/_auth/login")({
	component: RouteComponent,
	head: (ctx) => {
		const { i18n } = ctx.match.context;
		const t = translations(i18n.messages, i18n.locale, "head");
		return {
			meta: [{ title: t("title.login") }],
		};
	},
});

function RouteComponent() {
	const t = useTranslations("routes.auth.login");

	return (
		<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
			<p className="mt-4 text-gray-600">{t("placeholder")}</p>
		</div>
	);
}
