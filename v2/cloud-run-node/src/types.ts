import type { TraceVariables } from '~/lib/trace';

// NOTE(joel): Type definitions for the environment variables
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		interface ProcessEnv {
			PORT: string;
			PROJECT_ID: string;
		}
	}
}

export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type Variables = TraceVariables;
