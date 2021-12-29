import { produce } from 'immer';

/**
 * immer turns the `set` method into an immer proxy
 * @param {import('zustand').StoreApi} config
 * @returns {import('zustand').StateCreator}
 */
export function immer(config) {
	return function (set, get, api) {
		return config(
			(partial, replace) => {
				const nextState =
					typeof partial === 'function' ? produce(partial) : partial;
				return set(nextState, replace);
			},
			get,
			api,
		);
	};
}
