import express, { json } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { loadEnvConfig } from '@/helper/env';
import { trace, info } from '@/helper/console';
import { cacheControl } from '@/helper/cache-control';
import { enableFetchPolyfill } from '@/helper/node-fetch-polyfill';

// Polyfill fetch
enableFetchPolyfill();

// Load environment variables
loadEnvConfig('./', process.env.NODE_ENV !== 'production', {
	PORT: process.env.PORT || 3000,
});

// Import custom route implementations
import { router as helloWorld } from './routes/hello-world';

export const app = express();

// Use middlewares
app.use(
	cors({
		origin: true, // Reflect request origin
		methods: ['GET', 'OPTIONS'],
		preflightContinue: false,
		optionsSuccessStatus: 204,
	}),
);

if (process.env.GOOGLE_PROJECT != undefined) {
	app.use(trace({ projectId: process.env.GOOGLE_PROJECT }));
}
app.use(compression());
app.use(helmet());
app.use(json());
app.use(cacheControl());

// Fallback route
app.get(`/`, (_, res) => res.status(200).json());

// GCP health-check routes
app.get(`/_ah/**`, (_, res) => res.status(200).json());

// Custom routes
app.use(`/hello-world`, helloWorld);

// Start server (except when we're testing)
if (process.env.NODE_ENV !== 'test') {
	app.listen(process.env.PORT, () => {
		info(`Running server on port ${process.env.PORT}`);
	});
}
