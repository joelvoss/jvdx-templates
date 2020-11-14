import * as React from 'react';
import ReactDOM from 'react-dom';

import { MyComponent } from '../../dist/react-lib';

function Example() {
	return (
		<div>
			<h1>Basic example:</h1>
			<MyComponent />
		</div>
	);
}

ReactDOM.render(<Example />, document.getElementById('root'));
