import fs from 'node:fs';
import { resolve } from 'node:path';

/**
 * This is a simple database client that uses the file system to store data.
 * It is not production ready, but it is good enough for this demo.
 * Data is stored in a JSON file located at `<root>/tmp/file-system-db.json`.
 */
class FileSystemDBClient {
	private dbPath = resolve('.', 'tmp');
	private dbFile = resolve(this.dbPath, 'file-system-db.json');

	private _init() {
		if (!fs.existsSync(this.dbPath)) {
			fs.mkdirSync(this.dbPath, { recursive: true });
			fs.writeFileSync(this.dbFile, JSON.stringify({}), { encoding: 'utf-8' });
		}
	}

	private _sleep(min: number, max: number) {
		const delay = Math.floor(Math.random() * (max - min + 1)) + min;
		return new Promise(resolve => setTimeout(resolve, delay));
	}

	private async _readDB() {
		this._init();
		const rawData = fs.readFileSync(this.dbFile, {
			encoding: 'utf-8',
		});
		await this._sleep(500, 1000);
		return JSON.parse(rawData);
	}

	private async _writeDB(data: any) {
		this._init();
		await this._sleep(500, 1000);
		fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2), {
			encoding: 'utf-8',
		});
	}

	getItems() {
		return this._readDB();
	}

	async updateItems(data: any) {
		const currentData = this._readDB();
		const updatedData = { ...currentData, ...data };
		await this._writeDB(updatedData);
		return this.getItems();
	}
}

export const FileSystemDB = new FileSystemDBClient();
