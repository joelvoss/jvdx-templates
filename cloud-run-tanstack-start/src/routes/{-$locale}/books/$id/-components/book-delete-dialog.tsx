import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Heading } from "react-aria-components";

import {
	bookQueryOptions,
	deleteBookMutationOpts,
} from "~/features/books/client";
import { Dialog } from "~/shared/dialog";
import { useTranslations } from "~/shared/i18n";
import { Modal } from "~/shared/modal";
import { toastQueue } from "~/shared/toast";

////////////////////////////////////////////////////////////////////////////////

const Route = getRouteApi("/{-$locale}/books/$id/");

////////////////////////////////////////////////////////////////////////////////

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

	const { mutate, isPending, error, reset } = useMutation(
		deleteBookMutationOpts({ id }),
	);
	const navigate = Route.useNavigate();
	const closeModal = () => {
		reset();
		void navigate({
			search: (old: { modal?: "delete" }) => ({ ...old, modal: undefined }),
		});
	};

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
				void navigate({ to: "/{-$locale}/books" });
			},
		});
	};

	const globalErrors = error?.issues
		? [
				...(error.issues.root ?? []),
				...(error.issues.other ?? []),
				...Object.values(error.issues.nested ?? {}).flat(),
			]
		: undefined;

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

				{globalErrors?.length ? (
					<div
						role="alert"
						className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
					>
						<p className="font-medium">{t("errorTitle")}</p>
						<ul className="mt-2 list-disc space-y-1 pl-5">
							{globalErrors.map((message, index) => (
								<li key={index}>{message}</li>
							))}
						</ul>
					</div>
				) : null}

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
