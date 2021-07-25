import { getHost } from '@/lib/get-host';
import { useRouter } from 'next/router';

/**
 * @typedef SubmitOptions
 * @type {Object}
 * @prop {string} method
 * @prop {string} action
 * @prop {boolean} replace
 * @prop {string} redirect
 */

/**
 * @callback SubmitCallback
 * @param {string} url
 * @param {FormData|Object} form
 * @returns {void|Promise<void>}
 */

/**
 * useSubmit returns a helper method to submit forms.
 * @param {SubmitCallback} cb
 * @param {SubmitOptions} [options={}]
 * @returns {(evt: React.SyntheticEvent) => Promise<void>}
 */
export function useSubmit(cb, options = {}) {
	const router = useRouter();

	if (cb == null || typeof cb !== 'function') {
		throw new Error(`First argument must be of type "function"`);
	}

	return async evt => {
		evt.preventDefault();
		const target = evt.currentTarget;

		let method;
		let action;
		let formData;

		if (isFormElement(target)) {
			method = options.method || target.method;
			action = options.action || target.action;
			formData = new FormData(target);
		} else if (
			isButtonElement(target) ||
			(isInputElement(target) &&
				(target.type === 'submit' || target.type === 'image'))
		) {
			let form = target.form;

			if (form == null) {
				throw new Error(`Cannot submit a <button> without a <form>`);
			}

			// NOTE(joel): A submit button or input may override attributes of <form>
			method = options.method || target.formMethod || form.method;
			action = options.action || target.formAction || form.action;
			formData = new FormData(form);

			if (target.name) {
				formData.set(target.name, target.value);
			}
		} else {
			if (isHtmlElement(target)) {
				throw new Error(
					`Cannot submit element that is not <form>, <button>, or ` +
						`<input type="submit|image">`,
				);
			}

			method = options.method || 'GET';
			action = options.action || '';

			if (target instanceof FormData) {
				formData = target;
			} else {
				formData = new FormData();

				if (target instanceof URLSearchParams) {
					for (let [name, value] of target) {
						formData.set(name, value);
					}
				} else if (target != null) {
					for (let name of Object.keys(target)) {
						formData.set(name, target[name]);
					}
				}
			}
		}

		const { origin } = getHost();
		let url = new URL(action, origin);

		if (method.toUpperCase() === 'GET') {
			for (let [name, value] of formData) {
				if (typeof value === 'string') {
					url.searchParams.set(name, value);
				} else {
					throw new Error(`Cannot submit binary form data using GET`);
				}
			}
		}

		await cb(url, options.serialize ? serializeFormData(formData) : formData);
		if (options.redirect) {
			return options.replace
				? router.replace(origin + options.redirect)
				: router.push(origin + options.redirect);
		}
	};
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Tests, if a given object is a HTML element.
 * @param {object} object
 * @returns {boolean}
 */
function isHtmlElement(object) {
	return object != null && typeof object.tagName === 'string';
}

/**
 * Tests, if a given object is a <button> element.
 * @param {object} object
 * @returns {boolean}
 */
function isButtonElement(object) {
	return isHtmlElement(object) && object.tagName.toLowerCase() === 'button';
}

/**
 * Tests, if a given object is a <form> element.
 * @param {object} object
 * @returns {boolean}
 */
function isFormElement(object) {
	return isHtmlElement(object) && object.tagName.toLowerCase() === 'form';
}

/**
 * Tests, if a given object is a <input> element.
 * @param {object} object
 * @returns {boolean}
 */
function isInputElement(object) {
	return isHtmlElement(object) && object.tagName.toLowerCase() === 'input';
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Serializes a given FormData object.
 * @param {FormData} fd
 * @returns {object}
 */
function serializeFormData(fd) {
	let obj = {};
	for (let key of fd.keys()) {
		obj[key] = fd.get(key);
	}
	return obj;
}
