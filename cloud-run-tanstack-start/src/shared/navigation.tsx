import { useTranslations } from "~/shared/i18n";
import { LanguageSwitcher } from "~/shared/language-switcher";
import { LocalizedLink, LocalizedLinkProps } from "~/shared/localized-link";

////////////////////////////////////////////////////////////////////////////////

interface NavigationProps {
	hideLinks?: boolean;
}

/**
 * Navigation Component
 */
export function Navigation(props: NavigationProps) {
	const t = useTranslations("shared.navigation");

	return (
		<nav className="border-b border-gray-200 bg-white shadow-sm">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 justify-between">
					<div className="flex items-center">
						<LocalizedLink to="/" className="text-2xl font-bold text-sky-600">
							{t("title")}
						</LocalizedLink>
						{props.hideLinks ? null : (
							<div className="ml-10 flex space-x-8">
								<NavLink to="/books">{t("nav.books")}</NavLink>
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
 * NavLink Component
 */
function NavLink(props: LocalizedLinkProps) {
	return (
		<LocalizedLink
			{...props}
			className="inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
			inactiveProps={{
				className:
					"border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
			}}
			activeProps={{ className: "border-sky-500 text-gray-900" }}
		>
			{props.children}
		</LocalizedLink>
	);
}
