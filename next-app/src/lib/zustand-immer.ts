import { produce } from 'immer';

import type { Draft } from 'immer';
import type {
	GetState,
	SetState,
	State,
	StateCreator,
	StoreApi,
} from 'zustand';

export type ImmerSet<T> = (
	partial: ((draft: Draft<T>) => void) | T,
	replace?: boolean,
) => any;

/**
 * immer turns the `set` method into an immer proxy
 */
export function immer<
	T extends State,
	CustomSetState extends SetState<T>,
	CustomGetState extends GetState<T>,
	CustomStoreApi extends StoreApi<T>,
>(
	config: StateCreator<T, ImmerSet<T>, CustomGetState, CustomStoreApi>,
): StateCreator<T, CustomSetState, CustomGetState, CustomStoreApi> {
	return function (set, get, api) {
		return config(
			(partial, replace) => {
				const nextState =
					typeof partial === 'function'
						? // NOTE(joel): We need to cast a sligtly modified type to conform
						  // to the "immer" typing.
						  produce(partial as (state: Draft<T>) => T)
						: partial;
				return set(nextState, replace);
			},
			get,
			api,
		);
	};
}
