export function encodeBase64(input) {
	const buff = Buffer.from(input, 'utf-8');
	return buff.toString('base64');
}

export function decodeBase64(input) {
	const buff = Buffer.from(input, 'base64');
	return buff.toString('ascii');
}
