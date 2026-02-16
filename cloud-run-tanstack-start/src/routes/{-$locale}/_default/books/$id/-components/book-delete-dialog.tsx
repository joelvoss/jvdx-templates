import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Heading } from "react-aria-components";

import { useLocalizedNavigate } from "~/hooks/use-localized-navigate";
import { Dialog } from "~/shared/dialog";
import { useTranslations } from "~/shared/i18n";
import { Modal } from "~/shared/modal";
import { toastQueue } from "~/shared/toast";

import { Route } from "..";
import { deleteBookMutationOpts } from "../-mutations";
import { bookQueryOptions } from "../-queries";

/**
 * Book Delete Dialog Component.
 * Displays a confirmation dialog for deleting a book.
 */
export function BookDeleteDialog() {
	const { id } = Route.useParams();
	const { data } = useSuspenseQuery(bookQueryOptions({ id }));
	const t = useTranslations("routes.books.deleteDialog");

	const { modal } = Route.useSearch();
	const showDelete = modal != null && modal === "delete";

	const navigate = useLocalizedNavigate({ from: Route.fullPath });
	const closeModal = () => {
		void navigate({ search: (old) => ({ ...old, modal: undefined }) });
	};

	const { mutate, isPending } = useMutation(deleteBookMutationOpts({ id }));
	const onDelete = () => {
		mutate(undefined, {
			onSuccess: () => {
				toastQueue.add(
					{
						title: t("toastTitle"),
						description: t("toastDescription", { title: data.title }),
					},
					{ timeout: 5000 },
				);
				void navigate({ to: "/books" });
			},
		});
	};

	return (
		<Modal isDismissable isOpen={showDelete} onOpenChange={closeModal}>
			<Dialog>
				<Heading slot="title" className="mb-4 text-xl font-bold text-gray-900">
					{t("title")}
				</Heading>
				<p className="mb-6 text-gray-700">
					{t.rich("confirm", {
						strong: (chunks) => <strong>{chunks}</strong>,
						title: data.title,
					})}
				</p>

				<div className="flex gap-4">
					<button
						type="button"
						onClick={closeModal}
						disabled={isPending}
						className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50"
					>
						{t("cancel")}
					</button>
					<button
						type="button"
						onClick={onDelete}
						disabled={isPending}
						className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
					>
						{isPending ? t("deleting") : t("delete")}
					</button>
				</div>
			</Dialog>
		</Modal>
	);
}
