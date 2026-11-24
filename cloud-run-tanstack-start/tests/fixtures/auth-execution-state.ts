// NOTE: Shared execution state loaded via `vite.ssrLoadModule` so both
// `auth-http-server.mjs` and `auth-server-functions.ts` read/write the same
// module instance.
const state = {
	readCalls: 0,
	mutationCalls: 0,
	values: [] as string[],
};

export function recordRead() {
	state.readCalls++;
	return snapshot();
}

export function recordMutation(value: string) {
	state.mutationCalls++;
	state.values.push(value);
	return snapshot();
}

export function reset() {
	state.readCalls = 0;
	state.mutationCalls = 0;
	state.values.length = 0;
}

export function snapshot() {
	return { ...state, values: [...state.values] };
}
