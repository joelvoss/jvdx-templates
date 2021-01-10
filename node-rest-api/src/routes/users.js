import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { cacheControl } from '../helper/cache-control';
import { error, info } from '../helper/console';

// eslint-disable-next-line new-cap
export const router = express.Router();

// NOTE(joel): In-Memory user store for debugging purposes
let users = [];

/**
 * GET - All users
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Object[]}
 */
export async function getUsers(req, res) {
	try {
		const response = {
			users,
			count: users.length,
		};

		info(`GET /users - List ${users.length}/1000 users`);
		return res.status(200).json(response);
	} catch (err) {
		error(err.message, req.body);
		return res.status(400).json(err.message);
	}
}
router.get(`/`, cacheControl({ maxAge: 10, sMaxAge: 20 }), getUsers);

/**
 * POST - Create new user
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Object}
 */
export async function postUser(req, res) {
	try {
		const user = { uid: uuidv4(), ...req.body };
		users.push(user);

		info(`POST /users - User '${user.uid}' created`);
		return res.status(200).json(user);
	} catch (err) {
		error(err.message, req.body);
		return res.status(400).json(err.message);
	}
}
router.post(`/`, postUser);

/**
 * GET - Get user by ID
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Object}
 */
export async function getUserById(req, res) {
	try {
		const user = users.find(u => u.uid === req.params.userId);

		info(`GET /users/${req.params.userId} - Get user '${user.uid}'`);
		return res.status(200).json(user);
	} catch (err) {
		error(err.message, req.body);
		return res.status(400).json(err.message);
	}
}
router.get(`/:userId`, cacheControl({ maxAge: 10, sMaxAge: 20 }), getUserById);

/**
 * PUT - Update user by ID
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Object}
 */
export async function putUserById(req, res) {
	try {
		const idx = users.findIndex(u => u.uid === req.params.userId);
		const user = {
			...users[idx],
			...req.body,
		};
		users[idx] = user;

		info(`PUT /users/${req.params.userId} - User '${user.uid}' updated`);
		return res.status(200).json(user);
	} catch (err) {
		error(err.message, req.body);
		return res.status(400).json(err.message);
	}
}
router.put(`/:userId`, putUserById);

/**
 * DELETE - Delete user by ID
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Object}
 */
export async function deleteUserById(req, res) {
	try {
		const idx = users.find(u => u.uid === req.params.userId);
		delete users[idx];

		info(
			`DELETE /users/${req.params.userId} - User '${req.params.userId}' deleted`,
		);
		return res.status(200).json();
	} catch (err) {
		error(err.message, req.body);
		return res.status(400).json(err.message);
	}
}
router.delete(`/:userId`, deleteUserById);
