import { useMutation } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { createBookMutationOpts } from "~/features/books/client";
import { useTranslations } from "~/shared/i18n";
import { toastQueue } from "~/shared/toast";

import { BookForm } from "../../-components/book-form";

////////////////////////////////////////////////////////////////////////////////

const Route = getRouteApi("/{-$locale}/books/new/");

////////////////////////////////////////////////////////////////////////////////

/**
 * New Book Component.
 * Displays a form to create a new book.
 */
export function NewBook() {
	const t = useTranslations("routes.books.form");
	const navigate = Route.useNavigate();

	const { mutate, isPending, error } = useMutation({
		...createBookMutationOpts(),
		onSuccess: () => {
			toastQueue.add(
				{
					title: t("toasts.createdTitle"),
					description: t("toasts.createdDescription"),
				},
				{ timeout: 5000 },
			);
			void navigate({ to: "/{-$locale}/books" });
		},
	});

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		e.stopPropagation();
		const data = new FormData(e.currentTarget);
		mutate(data);
	};

	return (
		<BookForm
			onSubmit={handleSubmit}
			isPending={isPending}
			globalErrorTitle={t("createErrorTitle")}
			submitLabel={t("actions.create")}
			cancelTo="/{-$locale}/books"
			issues={error?.issues}
		/>
	);
}
