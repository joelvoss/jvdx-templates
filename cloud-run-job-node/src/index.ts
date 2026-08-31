import { fileURLToPath } from 'node:url';

import { Firestore } from '~/adapters/firestore';
import { logger } from '~/lib/logger';

////////////////////////////////////////////////////////////////////////////////

/**
 * Runs the job itself and lets errors propagate to the caller. Keeping the job
 * logic separate from process-level error handling also makes it easy to test.
 */
export async function main() {
	try {
		logger.addContext({
			taskIndex: Number(process.env.CLOUD_RUN_TASK_INDEX ?? 0),
			taskAttempt: Number(process.env.CLOUD_RUN_TASK_ATTEMPT ?? 0),
		});

		logger.info('Cloud Run job started');
		const books = await Firestore.listBooks();
		logger.info('Cloud Run job finished', {
			processedBooks: books.length,
		});
	} finally {
		await Firestore.close();
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Adapts job failures to the process boundary used by Cloud Run by logging the
 * error and setting the exit code to 1. The entrypoint calls this wrapper,
 * while tests can call main() directly and observe its rejected errors.
 */
export async function run() {
	try {
		await main();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		logger.error(message, { error });
		process.exitCode = 1;
	}
}

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): Run the job if this file is the entry point.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	run();
}
