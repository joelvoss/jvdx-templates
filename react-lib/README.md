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

## License

[MIT](./LICENSE)
