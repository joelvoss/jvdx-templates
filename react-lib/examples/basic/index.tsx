import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Counter } from '../../src/index';

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
root.render(
  <StrictMode>
    <Example />
  </StrictMode>,
);

////////////////////////////////////////////////////////////////////////////////

export function Example() {
	return (
		<div>
			<h1>Basic example:</h1>
			<Counter />
		</div>
	);
}
