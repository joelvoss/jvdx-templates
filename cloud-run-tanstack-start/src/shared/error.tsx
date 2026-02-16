import { rootRouteId, useMatch } from "@tanstack/react-router";

import { useTranslations } from "~/shared/i18n";
import { LocalizedLink } from "~/shared/localized-link";

////////////////////////////////////////////////////////////////////////////////

interface ErrorComponentProps<TError = Error> {
	error: TError;
}

/**
 * Error Component.
 * Renders a 500 page with a link to the homepage.
 * This component is used as the default error component for the router.
 * We don't include the default layout components here because this component
 * is rendered within the normal route tree.
 */
export function ErrorComponent(props: ErrorComponentProps) {
	const { error } = props;

	const t = useTranslations("shared.error");

	const isRoot = useMatch({
		strict: false,
		select: (state) => state.id === rootRouteId,
	});

	return (
		<div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
			<div className="text-center">
				<h1 className="mb-4 text-6xl font-bold text-gray-900">{t("code")}</h1>
				<h2 className="mb-4 text-2xl font-semibold text-gray-700">
					{t("title")}
				</h2>
				<p className="mb-8 text-gray-600">{error.message || t("message")}</p>
				{isRoot ? (
					<LocalizedLink
						to="/"
						className="inline-block rounded-lg bg-sky-600 px-6 py-3 text-white transition-colors hover:bg-sky-700"
					>
						{t("goHome")}
					</LocalizedLink>
				) : (
					<LocalizedLink
						to="/"
						className="inline-block rounded-lg bg-sky-600 px-6 py-3 text-white transition-colors hover:bg-sky-700"
						onClick={(e) => {
							e.preventDefault();
							window.history.back();
						}}
					>
						{t("goBack")}
					</LocalizedLink>
				)}
			</div>
		</div>
	);
}
