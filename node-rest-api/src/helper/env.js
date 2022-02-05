import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';
import { error, info } from './console';

let combinedEnv;
let cachedLoadedEnvFiles = [];

export function processEnv(loadedEnvFiles, dir, defaults) {
	// NOTE(joel): Don't reload env if we already have since this breaks escaped
	// environment values e.g. \$ENV_FILE_KEY
	if (process.env.__PROCESSED_ENV || loadedEnvFiles.length === 0) {
		return Object.assign(process.env, defaults);
	}
	// NOTE(joel): Flag that we processed the environment values in case a
	// serverless function is re-used
	process.env.__PROCESSED_ENV = 'true';

	const origEnv = Object.assign({}, process.env);
	const parsed = {};

	for (const envFile of loadedEnvFiles) {
		try {
			let result = {};
			result.parsed = dotenv.parse(envFile.contents);

			result = dotenvExpand(result);

			if (result.parsed) {
				info(`Loaded env from ${path.join(dir || '', envFile.path)}`);
			}

			for (const key of Object.keys(result.parsed || {})) {
				if (
					typeof parsed[key] === 'undefined' &&
					typeof origEnv[key] === 'undefined'
				) {
					parsed[key] = result.parsed?.[key];
				}
			}
		} catch (err) {
			error(
				`Failed to load env from ${path.join(dir || '', envFile.path)}`,
				err,
			);
		}
	}
	return Object.assign(process.env, defaults, parsed);
}

export function loadEnvConfig(dir = './', dev = true, defaults = {}) {
	// NOTE(joel): Don't reload env if we already have one since this breaks
	// escaped environment values e.g. \$ENV_FILE_KEY
	if (combinedEnv) return;

	const isTest = process.env.NODE_ENV === 'test';
	const mode = isTest ? 'test' : dev ? 'development' : 'production';
	const dotenvFiles = [
		`.env.${mode}.local`,
		// NOTE(joel): Don't include `.env.local` for `test` environment
		// since normally you expect tests to produce the same results for everyone
		mode !== 'test' && `.env.local`,
		`.env.${mode}`,
		'.env',
	].filter(Boolean);

	for (const envFile of dotenvFiles) {
		// NOTE(joel): Only load .env if the user provided has an env config file
		const dotEnvPath = path.join(dir, envFile);

		try {
			const stats = fs.statSync(dotEnvPath);

			// NOTE(joel): Make sure to only attempt to read files
			if (!stats.isFile()) {
				continue;
			}

			const contents = fs.readFileSync(dotEnvPath, 'utf8');
			cachedLoadedEnvFiles.push({
				path: envFile,
				contents,
			});
		} catch (err) {
			if (err.code !== 'ENOENT') {
				error(`Failed to load env from ${envFile}`, err);
			}
		}
	}

	combinedEnv = processEnv(cachedLoadedEnvFiles, dir, defaults);
}
