import express, { json } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { loadEnvConfig } from './helper/env';
import { trace, info } from './helper/console';
import { cacheControl } from './helper/cache-control';

// Load environment variables
loadEnvConfig('./', process.env.NODE_ENV !== 'production', {
	PORT: 3000,
});

// Routes
import { router as books } from './routes/books';

export const app = express();

// Middlewares
app.use(
	cors({
		origin: true, // Reflect request origin
		methods: ['GET', 'OPTIONS', 'PUT', 'POST', 'DELETE'],
		preflightContinue: false,
		optionsSuccessStatus: 204,
	}),
);
app.use(trace({ projectId: 'jvoss-base-prod' }));
app.use(compression());
app.use(helmet());
app.use(json());
app.use(cacheControl());

// Route configurations
app.get(`/`, (_, res) => res.status(200).json());

// NOTE(joel): Handle App-Engine /_ah/start, /_ah/stop, /_ah/health routes
app.get(`/_ah/**`, (_, res) => res.status(200).json());

// Custom routes
app.use(`/books`, books);

// Start server (except when we're testing)
if (process.env.NODE_ENV !== 'test') {
	app.listen(process.env.PORT, () => {
		info(`Running server on port ${process.env.PORT}`);
	});
}
