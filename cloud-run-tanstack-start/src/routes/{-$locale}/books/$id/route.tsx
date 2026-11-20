import { createFileRoute, Outlet } from "@tanstack/react-router";

import { bookQueryOptions } from "~/features/books/client";

////////////////////////////////////////////////////////////////////////////////

export const Route = createFileRoute("/{-$locale}/books/$id")({
	component: RouteComponent,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			bookQueryOptions({ id: params.id }),
		);
	},
});

////////////////////////////////////////////////////////////////////////////////

function RouteComponent() {
	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<Outlet />
		</div>
	);
}
