import { fileURLToPath } from 'node:url';

import { Firestore } from '~/adapters/firestore';
import { logger } from '~/lib/logger';

////////////////////////////////////////////////////////////////////////////////

/**
 * The main entry point for the Cloud Run job. This function is responsible for
 * setting up any necessary context for the job, running the main logic, and
 * logging the results.
 */
async function main() {
	logger.addContext({
		taskIndex: process.env.CLOUD_RUN_TASK_INDEX ?? 0,
		taskAttempt: process.env.CLOUD_RUN_TASK_ATTEMPT ?? 0,
	});

	logger.info('Cloud Run job started');
	const books = await Firestore.listBooks();
	logger.info('Cloud Run job finished', {
		processedBooks: books.length,
	});
}

// NOTE(joel): Run the job if this file is the entry point.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((error) => {
		const message = error instanceof Error ? error.message : 'Unknown error';
		logger.error(message, { error });
		process.exitCode = 1;
	});
}
