import type { TraceVariables } from '~/lib/trace';

// NOTE(joel): Type definitions for the environment variables
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			PORT: string;
			PROJECT_ID: string;
		}
	}
}

export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type Variables = TraceVariables;
