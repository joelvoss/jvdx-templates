import { add } from './add';

(async function () {
	console.log(`@jvdx/core node-lib template`);
	console.log(`2 + 2 = ${await add(2, 2)}`);
})();
