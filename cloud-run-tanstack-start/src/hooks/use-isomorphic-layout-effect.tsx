import { useLayoutEffect } from "react";

////////////////////////////////////////////////////////////////////////////////

const isClient = typeof document !== "undefined";
const noop = () => {};

////////////////////////////////////////////////////////////////////////////////

/**
 * A layout effect hook that works both on the client and server.
 * On the client, it behaves like `useLayoutEffect`, while on the server,
 * it falls back to a no-op to avoid warnings.
 */
export const useIsomorphicLayoutEffect = isClient ? useLayoutEffect : noop;
