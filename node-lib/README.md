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

- Node.js 22+

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

## License

[MIT](./LICENSE)
