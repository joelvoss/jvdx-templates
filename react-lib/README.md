# react-lib

A simple React component and hook library template.

## Requirements

- React 17+
- React DOM 17+

## Installation

```shell
npm install react react-dom react-lib
```

## Usage

```tsx
import { Counter, useCounter } from 'react-lib';

export function CounterExample() {
	return <Counter />;
}

export function HookExample() {
	const { count, increment, decrement } = useCounter();

	return (
		<div>
			<p>Count: {count}</p>
			<button type="button" onClick={increment}>
				+1
			</button>
			<button type="button" onClick={decrement}>
				-1
			</button>
		</div>
	);
}
```

If you scaffold from this template, replace `react-lib` with your package name
in the examples above.

More examples are available in [`examples/`](./examples).

## Development

Validate the template:

```shell
./Taskfile.sh validate
```

Build the distributable files:

```shell
./Taskfile.sh build
```

Run the Vite examples app:

```shell
./Taskfile.sh dev
```

This starts the dev server on [http://localhost:3000](http://localhost:3000).

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
