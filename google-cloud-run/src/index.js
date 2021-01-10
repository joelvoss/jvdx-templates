// Choose one of the following function signatures depending on the trigger
// type of your cloud function.

export async function handleHTTPTrigger(req, res) {
	res.send(`Hello World!`);
}

export async function handleStorageTrigger(file, context) {
	/* eslint-disable no-console */
	console.log(file, context);
	console.log(`  Event: ${context.eventId}`);
	console.log(`  Event Type: ${context.eventType}`);
	console.log(`  Bucket: ${file.bucket}`);
	console.log(`  File: ${file.name}`);
	console.log(`  Metageneration: ${file.metageneration}`);
	console.log(`  Created: ${file.timeCreated}`);
	console.log(`  Updated: ${file.updated}`);
	/* eslint-enable */
}

export async function handlePubSubTrigger(message, context) {
	const name = Buffer.from(message.data, 'base64').toString();

	// eslint-disable-next-line no-console
	console.log(`Hello, ${name}!`);
}
