import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { isValidLocale } from "~/lib/i18n";
import { Footer } from "~/shared/footer";
import { Navigation } from "~/shared/navigation";

////////////////////////////////////////////////////////////////////////////////

export const Route = createFileRoute("/{-$locale}/_default")({
	beforeLoad: ({ params }) => {
		const locale = params.locale;
		if (locale && !isValidLocale(locale)) {
			throw notFound();
		}
	},
	component: RouteComponent,
});

/**
 * Layout Component.
 * This component wraps all pages and includes the navigation and footer.
 */
function RouteComponent() {
	return (
		<div className="flex min-h-screen flex-col bg-gray-50">
			<Navigation />

			<main className="grow">
				<Outlet />
			</main>

			<Footer />
		</div>
	);
}
