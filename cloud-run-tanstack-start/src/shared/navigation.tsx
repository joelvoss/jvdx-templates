import type { LinkComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

import { useTranslations } from "~/shared/i18n";
import { LanguageSwitcher } from "~/shared/language-switcher";

////////////////////////////////////////////////////////////////////////////////

interface NavigationProps {
	hideLinks?: boolean;
}

/**
 * Navigation Component.
 * Renders a responsive navigation bar with links and a language switcher.
 */
export function Navigation(props: NavigationProps) {
	const t = useTranslations("shared.navigation");

	return (
		<nav className="border-b border-gray-200 bg-white shadow-sm">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 justify-between">
					<div className="flex items-center">
						<Link to="/{-$locale}" className="text-2xl font-bold text-sky-600">
							{t("title")}
						</Link>
						{props.hideLinks ? null : (
							<div className="ml-10 flex space-x-8">
								<NavLink to="/{-$locale}/books">{t("nav.books")}</NavLink>
							</div>
						)}
					</div>

					<div className="flex items-center">
						<LanguageSwitcher />
					</div>
				</div>
			</div>
		</nav>
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * NavLink Component.
 * A wrapper around the Link component that applies active/inactive styles
 * based on the current route.
 */
function NavLink(props: LinkComponentProps) {
	return (
		<Link
			{...props}
			className="inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
			inactiveProps={{
				className:
					"border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
			}}
			activeProps={{ className: "border-sky-500 text-gray-900" }}
		>
			{props.children}
		</Link>
	);
}
