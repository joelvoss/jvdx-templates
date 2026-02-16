let IDX = 256;
const HEX: string[] = [];
const SIZE = 256;
let BUFFER: string;

// NOTE(joel): Pre-generate a buffer of random hex characters for efficient UID
// generation.
while (IDX--) HEX[IDX] = (IDX + 256).toString(16).substring(1);

/**
 * Generate a unique ID string of the specified length (default: 11).
 * Uses a pre-generated buffer of random hex characters for efficiency.
 */
export function uid(len?: number): string {
	let i = 0;
	let tmp = len || 11;
	if (!BUFFER || IDX + tmp > SIZE * 2) {
		for (BUFFER = "", IDX = 0; i < SIZE; i++) {
			BUFFER += HEX[(Math.random() * 256) | 0];
		}
	}

	return BUFFER.substring(IDX, IDX++ + tmp);
}
