import * as fs from 'fs';
import * as path from 'path';
import { parse as dotenvParse } from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';
import { error, info } from '@/helper/console';
import { isNonNull } from '@/helper/assertions';

////////////////////////////////////////////////////////////////////////////////

import type { DotenvExpandOptions } from 'dotenv-expand';

type EnvFile = {
	path: string;
	contents: string;
};

type EnvMap = Record<string, string | number | undefined>;

////////////////////////////////////////////////////////////////////////////////

let combinedEnv: EnvMap;
let cachedLoadedEnvFiles: EnvFile[] = [];

/**
 * processEnv processes a set of environment variable files and
 */
export function processEnv(
	loadedEnvFiles: EnvFile[],
	dir: string,
	defaults: EnvMap,
) {
	// NOTE(joel): Don't re-process environemnt variables if we already have a
	// set of combined environemnt variables since this would breaks escaped
	// environment values e.g. \$ENV_FILE_KEY.
	if (process.env.__PROCESSED_ENV || loadedEnvFiles.length === 0) {
		return Object.assign(process.env, defaults);
	}
	// NOTE(joel): Flag that we processed the environment values in case a
	// serverless function is re-used.
	process.env.__PROCESSED_ENV = 'true';

	const origEnv = Object.assign({}, process.env);

	const parsed: EnvMap = {};
	for (const envFile of loadedEnvFiles) {
		try {
			let result: DotenvExpandOptions = {};
			result.parsed = dotenvParse(envFile.contents);

			result = dotenvExpand(result);

			if (isNonNull(result.parsed)) {
				info(`Loaded env from ${path.join(dir || '', envFile.path)}`);

				for (const key of Object.keys(result.parsed)) {
					if (isNonNull(parsed[key]) || isNonNull(origEnv[key])) continue;
					parsed[key] = result.parsed[key];
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

////////////////////////////////////////////////////////////////////////////////

/**
 * loadEnvConfig loads a local `.env` file depending on the environment.
 */
export function loadEnvConfig(
	dir: string = './',
	dev: boolean = true,
	defaults: EnvMap = {},
) {
	// NOTE(joel): Don't reload environemnt variables if we already have a set of // combined environemnt variables since this would breaks escaped environment
	// values e.g. \$ENV_FILE_KEY.
	if (combinedEnv) return;

	const isTest = process.env.NODE_ENV === 'test';
	const mode = isTest ? 'test' : dev ? 'development' : 'production';
	const dotenvFiles = [
		`.env.${mode}.local`,
		// NOTE(joel): Don't include `.env.local` for `test` environment
		// since normally you expect tests to produce the same results in every
		// environment.
		mode !== 'test' ? `.env.local` : '',
		`.env.${mode}`,
		'.env',
	].filter(value => value !== '');

	for (const envFile of dotenvFiles) {
		const dotEnvPath = path.join(dir, envFile);

		try {
			const stats = fs.statSync(dotEnvPath);

			// NOTE(joel): Make sure to only attempt to read existent files.
			if (!stats.isFile()) continue;

			const contents = fs.readFileSync(dotEnvPath, 'utf8');
			cachedLoadedEnvFiles.push({ path: envFile, contents });
		} catch (err: any) {
			if (err.code !== 'ENOENT') {
				error(`Failed to load env from ${envFile}`, err);
			}
		}
	}

	combinedEnv = processEnv(cachedLoadedEnvFiles, dir, defaults);
}
