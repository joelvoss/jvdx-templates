import { mkdir, writeFile } from 'node:fs/promises';
import {
	dirname,
	extname,
	join,
	normalize,
	relative,
	resolve,
} from 'node:path';
import ts from 'typescript';
import type { Plugin } from 'vite';

////////////////////////////////////////////////////////////////////////////////

interface DtsBundlePluginOptions {
	entry?: string;
	project?: string;
	outFile?: string;
}

type DeclarationMap = Map<string, string>;

/**
 * Creates a Vite plugin that bundles TypeScript declaration files into a
 * single `.d.ts` file.
 */
export function dtsBundle(options: DtsBundlePluginOptions = {}): Plugin {
	let rootDir = process.cwd();
	let resolvedOutDir = resolve(rootDir, 'dist');

	return {
		name: 'vite-plugin-dts-bundle',
		apply: 'build',
		enforce: 'post',
		// NOTE(joel): Ensure resolved output directory is captured from Vite
		// config (overwrites fallbacks in plugin scope).
		configResolved(config) {
			rootDir = config.root;
			resolvedOutDir = resolve(rootDir, config.build.outDir ?? 'dist');
		},
		// NOTE(joel): Build and bundle declarations after Vite build is complete.
		async closeBundle() {
			const projectPath = resolve(rootDir, options.project ?? 'tsconfig.json');
			const configDir = dirname(projectPath);
			const configFile = ts.readConfigFile(projectPath, ts.sys.readFile);

			if (configFile.error) {
				throw new Error(
					ts.formatDiagnosticsWithColorAndContext([configFile.error], {
						getCanonicalFileName: f => f,
						getCurrentDirectory: () => configDir,
						getNewLine: () => '\n',
					}),
				);
			}

			const parseConfigHost: ts.ParseConfigHost = {
				fileExists: ts.sys.fileExists,
				readFile: ts.sys.readFile,
				readDirectory: ts.sys.readDirectory,
				useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
			};

			const parsedConfig = ts.parseJsonConfigFileContent(
				configFile.config,
				parseConfigHost,
				configDir,
				{
					declaration: true,
					emitDeclarationOnly: true,
					declarationMap: false,
					noEmit: false,
					incremental: false,
				},
				projectPath,
			);

			// NOTE(joel): Force declaration-only emit regardless of author tsconfig
			// settings.
			parsedConfig.options.declaration = true;
			parsedConfig.options.emitDeclarationOnly = true;
			parsedConfig.options.declarationMap = false;
			parsedConfig.options.noEmit = false;
			parsedConfig.options.outDir = undefined;
			parsedConfig.options.declarationDir = undefined;

			const compilerHost = ts.createCompilerHost(parsedConfig.options);
			const declarationOutput: DeclarationMap = new Map();

			// NOTE(joel): Capture declaration emit into memory so we can
			// post-process it later.
			compilerHost.writeFile = (fileName, contents) => {
				if (!fileName.endsWith('.d.ts')) return;
				const normalizedName = normalizePath(fileName);
				declarationOutput.set(normalizedName, contents);
			};

			// NOTE(joel): Create and emit the TypeScript program.
			const program = ts.createProgram(
				parsedConfig.fileNames,
				parsedConfig.options,
				compilerHost,
			);
			const emitResult = program.emit(undefined, undefined, undefined, true);
			const diagnostics = ts
				.getPreEmitDiagnostics(program)
				.concat(emitResult.diagnostics);

			if (diagnostics.length > 0) {
				throw new Error(
					ts.formatDiagnosticsWithColorAndContext(diagnostics, {
						getCanonicalFileName: f => f,
						getCurrentDirectory: () => rootDir,
						getNewLine: () => '\n',
					}),
				);
			}

			const entrySource = resolve(
				rootDir,
				options.entry ?? getPackageSource(rootDir),
			);
			const entryDeclaration = normalizePath(
				resolveDeclarationForSource(entrySource),
			);

			if (!declarationOutput.has(entryDeclaration)) {
				throw new Error(
					`Declaration output for entry "${entryDeclaration}" was not generated.`,
				);
			}

			// NOTE(joel): Bundle declarations and write to output file.
			const bundled = bundleDeclarations(entryDeclaration, declarationOutput);
			const outFile =
				options.outFile ?? inferOutFileFromPackage(rootDir, resolvedOutDir);
			const outputPath = resolve(resolvedOutDir, outFile);

			await mkdir(dirname(outputPath), { recursive: true });
			await writeFile(outputPath, bundled, 'utf8');
		},
	};
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves the "source" field from the package.json in the specified root
 * directory.
 */
function getPackageSource(rootDir: string): string {
	const packageJsonPath = resolve(rootDir, 'package.json');
	const packageJson = JSON.parse(ts.sys.readFile(packageJsonPath) ?? '{}') as {
		source?: string;
	};

	if (!packageJson.source) {
		throw new Error(
			'Unable to determine package "source" entry. Please provide an "entry" option.',
		);
	}

	return packageJson.source;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves the "types" field from the package.json in the specified root
 * directory.
 */
function getPackageTypes(rootDir: string): string | undefined {
	const packageJsonPath = resolve(rootDir, 'package.json');
	const packageJson = JSON.parse(ts.sys.readFile(packageJsonPath) ?? '{}') as {
		types?: string;
	};
	return packageJson.types;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Bundles TypeScript declaration files starting from the specified entry file,
 * recursively inlining relative imports.
 */
function bundleDeclarations(entry: string, declarations: DeclarationMap) {
	const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
	const visited = new Set<string>();
	const chunks: string[] = [];

	const sourceFileCache = new Map<string, ts.SourceFile>();

	/**
	 * Reads and parses a declaration file, caching the result.
	 */
	const readSource = (filePath: string): ts.SourceFile => {
		const normalized = normalizePath(filePath);
		if (!sourceFileCache.has(normalized)) {
			const contents = declarations.get(normalized);
			if (contents === undefined) {
				throw new Error(`Missing declaration for "${normalized}".`);
			}
			sourceFileCache.set(
				normalized,
				ts.createSourceFile(
					normalized,
					contents,
					ts.ScriptTarget.Latest,
					false,
					ts.ScriptKind.TS,
				),
			);
		}
		const cached = sourceFileCache.get(normalized);
		if (!cached) {
			throw new Error(`Missing cached declaration for "${normalized}".`);
		}
		return cached;
	};

	/**
	 * Visits a declaration file, inlines its relative dependencies, and collects
	 * its local statements.
	 */
	const visit = (filePath: string) => {
		const normalized = normalizePath(filePath);
		if (visited.has(normalized)) return;
		visited.add(normalized);

		const sourceFile = readSource(normalized);
		const dependencySpecifiers: string[] = [];
		const hoistedNamedImports = new Set<string>();
		const localStatements: ts.Statement[] = [];

		for (const statement of sourceFile.statements) {
			// NOTE(joel): If the statement is an import with a relative module
			// specifier, hoist the referenced module before printing this file to
			// preserve symbol order.
			if (
				ts.isImportDeclaration(statement) &&
				ts.isStringLiteral(statement.moduleSpecifier)
			) {
				const spec = statement.moduleSpecifier.text;
				if (isRelativeModule(spec)) {
					if (statement.importClause) {
						const { namedBindings } = statement.importClause;
						if (namedBindings && ts.isNamedImports(namedBindings)) {
							for (const element of namedBindings.elements) {
								if (!element.propertyName) {
									hoistedNamedImports.add(element.name.text);
								}
							}
						}
					}
					const resolved = resolveRelativeDeclaration(
						normalized,
						spec,
						declarations,
					);
					if (resolved) {
						dependencySpecifiers.push(resolved);
						continue;
					}
				}
			}

			// NOTE(joel): If the statement is an export with a relative module
			// specifier, hoist the referenced module before printing this file to
			// preserve symbol order.
			if (
				ts.isExportDeclaration(statement) &&
				statement.moduleSpecifier &&
				ts.isStringLiteral(statement.moduleSpecifier)
			) {
				const spec = statement.moduleSpecifier.text;
				if (isRelativeModule(spec)) {
					const resolved = resolveRelativeDeclaration(
						normalized,
						spec,
						declarations,
					);
					if (resolved) {
						dependencySpecifiers.push(resolved);
						continue;
					}
				}
			}

			// NOTE(joel): Skip `export { foo }` with no module specifier when every
			// name is sourced from a hoisted relative import. Without this guard we
			// end up with duplicate exports once the dependency has been inlined.
			if (
				ts.isExportDeclaration(statement) &&
				!statement.moduleSpecifier &&
				statement.exportClause &&
				ts.isNamedExports(statement.exportClause)
			) {
				const elements = statement.exportClause.elements;
				const shouldSkip = elements.every(element => {
					if (element.propertyName) return false;
					return hoistedNamedImports.has(element.name.text);
				});
				if (shouldSkip) {
					continue;
				}
			}

			// NOTE(joel): Otherwise, retain the local statement for printing.
			localStatements.push(statement);
		}

		// NOTE(joel): Visit dependencies first to preserve symbol order.
		for (const dependency of dependencySpecifiers) {
			visit(dependency);
		}

		const printed = localStatements
			.map(statement =>
				printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile),
			)
			.filter(text => text.trim().length > 0)
			.join('\n');

		if (printed.length > 0) {
			chunks.push(printed);
		}
	};

	visit(entry);

	return `${chunks.join('\n\n').trim()}\n`;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Resolves the declaration file path for a given source file.
 */
function resolveDeclarationForSource(sourceFile: string) {
	const ext = extname(sourceFile);
	switch (ext) {
		case '.ts':
		case '.tsx':
		case '.js':
		case '.jsx':
		case '.mjs':
		case '.cjs':
			return `${sourceFile.slice(0, -ext.length)}.d.ts`;
		case '.mts':
			return `${sourceFile.slice(0, -ext.length)}.d.mts`;
		case '.cts':
			return `${sourceFile.slice(0, -ext.length)}.d.cts`;
		default:
			return `${sourceFile}.d.ts`;
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Resolves a relative module specifier to a declaration file path, if it exists
 * in the provided declarations map.
 */
function resolveRelativeDeclaration(
	fromFile: string,
	specifier: string,
	declarations: DeclarationMap,
) {
	const fromDir = dirname(fromFile);
	const resolvedSpecifier = resolve(fromDir, specifier);
	const candidates = computeDeclarationCandidates(resolvedSpecifier);

	for (const candidate of candidates) {
		const normalized = normalizePath(candidate);
		if (declarations.has(normalized)) {
			return normalized;
		}
	}

	return undefined;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Computes possible declaration file candidates for a given module resolution.
 * We try the same resolution order TypeScript would follow for declaration
 * files.
 */
function computeDeclarationCandidates(resolvedPath: string) {
	const base = resolvedPath.replace(/\.(cts|mts|ts|cjs|mjs|js|tsx|jsx)$/u, '');
	return [
		`${resolvedPath}.d.ts`,
		`${base}.d.ts`,
		`${base}.d.mts`,
		`${base}.d.cts`,
		join(base, 'index.d.ts'),
		join(base, 'index.d.mts'),
		join(base, 'index.d.cts'),
	];
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Determines if a module specifier is relative.
 */
function isRelativeModule(specifier: string) {
	return specifier.startsWith('.') || specifier.startsWith('..');
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Normalizes a file path to use forward slashes.
 */
function normalizePath(fileName: string) {
	return normalize(fileName).replace(/\\/g, '/');
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Infers the output declaration file path from the package.json "types" field.
 */
function inferOutFileFromPackage(rootDir: string, outDir: string) {
	const packageTypes = getPackageTypes(rootDir);
	if (!packageTypes) {
		return 'index.d.ts';
	}

	const absoluteTypesPath = resolve(rootDir, packageTypes);
	const relativeToOutDir = relative(outDir, absoluteTypesPath);
	if (relativeToOutDir.startsWith('..')) {
		return 'index.d.ts';
	}

	return relativeToOutDir === '' ? 'index.d.ts' : relativeToOutDir;
}
