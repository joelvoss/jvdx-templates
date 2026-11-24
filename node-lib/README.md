# node-lib template

A starting point for a small Node library with TypeScript, Vite bundling, and
Vitest.

## Customize After Scaffolding

Before publishing, update these template values:

- replace `node-lib` with your package name in `package.json` and the examples
  below
- replace the sample API (`add`, `calculator`, `Operations`) with your real
  public exports
- update package metadata such as `description`, `license`, and any repository
  fields you want to publish

## Requirements

- Node.js 26+

## Installation

Replace `<your-package-name>` with the package name from `package.json`.

```shell
npm install <your-package-name>
```

## Usage

Replace the import path and sample exports with your actual library API.

```ts
import { Operations, add, calculator } from '<your-package-name>';

console.log(add(2, 3));
// 5

console.log(calculator(Operations.Add, 4, 6));
// 10
```

## Development

Run the full validation suite:

```shell
./Taskfile.sh validate
```

Build the distributable files:

```shell
./Taskfile.sh build
```

## Releases

Releases are cut manually via the **Release** GitHub Actions workflow
(`.github/workflows/release.yml`), which runs `semantic-release` against `main`
(configured in `.releaserc.json`).

1. Make sure commits merged into `main` follow
   [Conventional Commits](https://www.conventionalcommits.org/) (`fix:` for a
   patch release, `feat:` for a minor release, `BREAKING CHANGE:` or `!` for a
   major release).
2. Run the workflow on `main` from the GitHub **Actions** tab (**Release → Run
   workflow**) or with the GitHub CLI:

   ```shell
   gh workflow run release.yml --ref main
   ```

The workflow determines the next version from the commit history, updates
`CHANGELOG.md`, `package.json`, and `package-lock.json`, commits the changes
with `[skip ci]`, pushes a version tag, and creates a GitHub Release
(`npmPublish` is `false`, so it does not publish to npm).

## License

[MIT](./LICENSE)
