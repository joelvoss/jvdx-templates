/* eslint-disable no-console */

import * as functions from '@google-cloud/functions-framework';

// NOTE(joel): Choose one of the following function signatures depending on the
// trigger type of your cloud function.

////////////////////////////////////////////////////////////////////////////////

/**
 * HTTP-Function
 */
functions.http('helloHttp', (req, res) => {
	res.json({ message: 'Hello World!' });
});

////////////////////////////////////////////////////////////////////////////////

type File = {
	bucket: string;
	name: string;
	metageneration: string;
	timeCreated: string;
	updated: string;
};

/**
 * Storage-Trigger-Function
 */
functions.cloudEvent<File>('helloGCS', cloudEvent => {
	console.log(`Event ID: ${cloudEvent.id}`);
	console.log(`Event Type: ${cloudEvent.type}`);

	const file = cloudEvent.data;
	if (!file) return;

	console.log(`Bucket: ${file.bucket}`);
	console.log(`File: ${file.name}`);
	console.log(`Metageneration: ${file.metageneration}`);
	console.log(`Created: ${file.timeCreated}`);
	console.log(`Updated: ${file.updated}`);
});

////////////////////////////////////////////////////////////////////////////////

type PubSubMessage = {
	message: {
		data: string;
	};
};

/**
 * PubSub-Trigger-Function
 */
functions.cloudEvent<PubSubMessage>('helloPubSub', cloudEvent => {
	const data = cloudEvent.data;
	if (!data) return;

	// NOTE(joel): The Pub/Sub message is passed as the CloudEvent's data payload.
	const base64name = data.message.data;

	const name = base64name
		? Buffer.from(base64name, 'base64').toString()
		: 'World';

	console.log(`Hello ${name}!`);
});
