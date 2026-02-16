import { Footer } from "~/shared/footer";
import { useTranslations } from "~/shared/i18n";
import { Navigation } from "~/shared/navigation";

////////////////////////////////////////////////////////////////////////////////

/**
 * Not Found Component.
 * Renders a 404 page with a link to the homepage.
 * We have to include the default layout components here because this component
 * is rendered outside of the normal route tree.
 */
export function NotFoundComponent() {
	const t = useTranslations("shared.notfound");

	return (
		<div className="flex min-h-screen flex-col bg-gray-50">
			<Navigation />

			<main className="grow">
				<div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="mb-4 text-6xl font-bold text-gray-900">
							{t("code")}
						</h1>
						<h2 className="mb-4 text-2xl font-semibold text-gray-700">
							{t("title")}
						</h2>
						<button
							onClick={() => window.history.back()}
							className="inline-block rounded-lg bg-sky-600 px-6 py-3 text-white transition-colors hover:bg-sky-700"
						>
							{t("goBack")}
						</button>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
