import { useTranslations } from "~/shared/i18n";

////////////////////////////////////////////////////////////////////////////////

/**
 * Footer Component
 */
export function Footer() {
	const t = useTranslations("shared.footer");

	return (
		<footer className="mt-12 border-t border-gray-200 bg-white">
			<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<p className="text-center text-sm text-gray-500">
					{t("copy", { year: new Date().getFullYear() })}
				</p>
			</div>
		</footer>
	);
}
