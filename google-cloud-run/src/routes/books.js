import express from 'express';
import { decodeBase64, encodeBase64 } from '../helper/base64';
import { cacheControl } from '../helper/cache-control';
import { error, info } from '../helper/console';

// eslint-disable-next-line new-cap
export const router = express.Router();

// DEBUG: In-memory DB. Remove before use.
const db = {
	books: [
		{
			id: 'eyJ0aXRsZSI6Im15LWJvb2siLCJhdXRob3IiOiJtZSJ9',
			title: 'my-book',
			author: 'me',
		},
		{
			id: 'eyJ0aXRsZSI6Im15LWJvb2stMiIsImF1dGhvciI6Im1lLTIifQ==',
			title: 'my-book-2',
			author: 'me-2',
		},
	],
};

/**
 * GET - /{parent=books}
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Object[]}
 */
export async function listCollection(req, res) {
	const { query } = req;
	const pageSize = Math.max(1, Math.min(query.page_size || 10, 1000));
	const pageToken = query.page_token;

	try {
		info(`GET /books`);

		let startIndex = 0;
		if (pageToken) {
			const token = decodeBase64(pageToken);
			startIndex = db.books.findIndex(b => {
				let match = false;
				for (let key of token) {
					if (key in b && token[key] === b[key]) {
						match = true;
					}
				}
				return match;
			});
		}

		const books = db.books.slice(startIndex, pageSize);
		const totalSize = db.books.length;

		let nextPageToken = '';
		if (startIndex + pageSize < totalSize) {
			nextPageToken = encodeBase64(JSON.stringify(books[books.length - 1]));
		}

		res.status(200).json({
			books,
			next_page_token: nextPageToken,
			total_size: totalSize,
		});
	} catch (err) {
		error(err.message, req.body);
		return res.status(400).json(err.message);
	}
}
router.get(`/`, cacheControl({ maxAge: 10, sMaxAge: 20 }), listCollection);

/**
 * POST - /{parent=books}
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Object}
 */
export async function createResource(req, res) {
	try {
		info(`POST /books`);
		const payload = {
			title: req.body.title,
			author: req.body.author,
		};

		const book = {
			id: encodeBase64(JSON.stringify(payload)),
			...payload,
		};
		db.books.push(book);
		res.status(200).json({ book });
	} catch (err) {
		error(err.message, req.body);
		return res.status(400).json(err.message);
	}
}
router.post(`/`, createResource);

/**
 * GET - /{parent=books}/:id
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Object}
 */
export async function getResource(req, res) {
	const { params } = req;
	const id = params.id;

	try {
		info(`GET /books/:id`);

		const book = db.books.find(b => b.id === id);

		res.status(200).json(book);
	} catch (err) {
		error(err.message, req.body);
		return res.status(400).json(err.message);
	}
}
router.get(`/:id`, cacheControl({ maxAge: 10, sMaxAge: 20 }), getResource);

/**
 * PUT - /{parent=books}/:id
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Object}
 */
export async function updateResource(req, res) {
	const { params, body } = req;
	const id = params.id;

	try {
		info(`PUT /books/:id`);

		const index = db.books.findIndex(b => b.id === id);
		const book = {
			...db.books[index],
			...body,
		};

		res.status(200).json(book);
	} catch (err) {
		error(err.message, req.body);
		return res.status(400).json(err.message);
	}
}
router.put(`/:id`, updateResource);

/**
 * DELETE - /{parent=books}/:id
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Object}
 */
export async function deleteResource(req, res) {
	const { params } = req;
	const id = params.id;

	try {
		info(`DELETE /books/:id`);

		const index = db.books.findIndex(b => b.id === id);
		db.books = [...db.books.slice(0, index), ...db.books.slice(index + 1)];

		res.status(200).send();
	} catch (err) {
		error(err.message, req.body);
		return res.status(400).json(err.message);
	}
}
router.delete(`/:id`, deleteResource);
