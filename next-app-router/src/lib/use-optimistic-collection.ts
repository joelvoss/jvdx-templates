'use client';

import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';

interface OptimisticCollectionOptions<T extends { id: string }> {
	create: (item: Omit<T, 'id'>) => Promise<T>;
	update: (item: T) => Promise<T>;
	remove: (id: string) => Promise<void>;
	errors: {
		create: string;
		update: string;
		remove: string;
	};
}

type CollectionAction<T> =
	| { type: 'add'; item: T }
	| { type: 'remove'; id: string }
	| { type: 'update'; item: T };

/**
 * Manages optimistic create, update, and delete operations for a collection.
 * React rebases reducer actions when the canonical collection changes.
 */
export function useOptimisticCollection<T extends { id: string }>(
	initialItems: Array<T>,
	options: OptimisticCollectionOptions<T>,
) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
	const [items, dispatch] = useOptimistic(
		initialItems,
		(currentItems: Array<T>, action: CollectionAction<T>) => {
			switch (action.type) {
				case 'add':
					return [...currentItems, action.item];
				case 'remove': {
					const nextItems: Array<T> = [];
					for (const item of currentItems) {
						if (item.id !== action.id) nextItems.push(item);
					}
					return nextItems;
				}
				case 'update': {
					const nextItems = [...currentItems];
					for (let index = 0; index < nextItems.length; index++) {
						if (nextItems[index].id === action.item.id) {
							nextItems[index] = action.item;
							break;
						}
					}
					return nextItems;
				}
			}
		},
	);

	const addItem = (item: Omit<T, 'id'>) => {
		const optimisticItem = {
			...item,
			id: `optimistic-${crypto.randomUUID()}`,
		} as T;

		setError(null);
		startTransition(async () => {
			dispatch({ type: 'add', item: optimisticItem });
			try {
				await options.create(item);
				router.refresh();
			} catch (reason) {
				setError(
					reason instanceof Error ? reason.message : options.errors.create,
				);
			}
		});
	};

	const removeItem = (item: T) => {
		if (removingIds.has(item.id)) return;

		setError(null);
		setRemovingIds(currentIds => new Set(currentIds).add(item.id));
		startTransition(async () => {
			dispatch({ type: 'remove', id: item.id });
			try {
				await options.remove(item.id);
				router.refresh();
			} catch (reason) {
				setError(
					reason instanceof Error ? reason.message : options.errors.remove,
				);
			} finally {
				setRemovingIds(currentIds => {
					const nextIds = new Set(currentIds);
					nextIds.delete(item.id);
					return nextIds;
				});
			}
		});
	};

	const updateItem = (item: T) => {
		setError(null);
		startTransition(async () => {
			dispatch({ type: 'update', item });
			try {
				await options.update(item);
				router.refresh();
			} catch (reason) {
				setError(
					reason instanceof Error ? reason.message : options.errors.update,
				);
			}
		});
	};

	return {
		items,
		error,
		removingIds,
		pendingMutations: isPending ? 1 : 0,
		addItem,
		removeItem,
		updateItem,
		clearError: () => setError(null),
	};
}
