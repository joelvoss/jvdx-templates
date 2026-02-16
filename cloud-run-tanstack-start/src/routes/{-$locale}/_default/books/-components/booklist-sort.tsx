////////////////////////////////////////////////////////////////////////////////

import { useTranslations } from "~/shared/i18n";
import { LocalizedLink, LocalizedLinkProps } from "~/shared/localized-link";

import { Route } from "..";

export function BookListSort() {
	const t = useTranslations("routes.books.sort");

	return (
		<div className="mb-6 flex gap-2">
			<span className="self-center text-sm text-gray-600">{t("label")}</span>
			<SortBtn to={Route.to} preload={false} search={{ sort: undefined }}>
				{t("default")}
			</SortBtn>
			<SortBtn to={Route.to} preload={false} search={{ sort: "title" }}>
				{t("title")}
			</SortBtn>
			<SortBtn to={Route.to} preload={false} search={{ sort: "author" }}>
				{t("author")}
			</SortBtn>
			<SortBtn to={Route.to} preload={false} search={{ sort: "year" }}>
				{t("year")}
			</SortBtn>
		</div>
	);
}

////////////////////////////////////////////////////////////////////////////////

interface SortBtnProps extends LocalizedLinkProps {
	sortKey?: string;
}

function SortBtn(props: SortBtnProps) {
	const { sort } = Route.useSearch();

	const { search } = props;
	const sortKey = typeof search === "object" ? search.sort : undefined;

	if (sort === sortKey) {
		return (
			<LocalizedLink
				{...props}
				className="rounded px-3 py-1 text-sm cursor-pointer bg-sky-600 hover:bg-sky-700 text-white"
			/>
		);
	}

	return (
		<LocalizedLink
			{...props}
			className="rounded px-3 py-1 text-sm cursor-pointer bg-gray-100 hover:bg-gray-200"
		/>
	);
}
