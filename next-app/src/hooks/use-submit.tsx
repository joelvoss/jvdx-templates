import { useRouter } from 'next/router';
import {
	isButtonElement,
	isFormElement,
	isFunction,
	isHtmlElement,
	isInputElement,
	isNonNull,
} from '@/lib/assertions';
import { getHost } from '@/lib/get-host';

import type { SyntheticEvent } from 'react';

type SubmitCallback = (
	url: URL,
	form: FormData | { [key: string]: FormDataEntryValue | null },
) => void | Promise<void>;

type SubmitOptions = {
	method?: string;
	action?: string;
	replace?: boolean;
	redirect?: string;
	serialize?: boolean;
};

////////////////////////////////////////////////////////////////////////////////

/**
 * useSubmit returns a helper method to submit forms.
 */
export function useSubmit(cb: SubmitCallback, options: SubmitOptions = {}) {
	const router = useRouter();

	if (!isFunction(cb)) {
		throw new Error(`First argument must be of type "function"`);
	}

	return async (evt: SyntheticEvent<any>) => {
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

			if (!isNonNull(form)) {
				console.error(`Cannot submit a <button> without a <form>`);
				return;
			}

			// NOTE(joel): A submit button or input may override attributes of <form>.
			method = options.method || target.formMethod || form.method;
			action = options.action || target.formAction || form.action;
			formData = new FormData(form);

			if (target.name) {
				formData.set(target.name, target.value);
			}
		} else {
			if (isHtmlElement(target)) {
				console.error(
					`Cannot submit element that is not <form>, <button>, or ` +
						`<input type="submit|image">`,
				);
				return;
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
		const url = new URL(action, origin);

		if (method.toUpperCase() === 'GET') {
			for (let [name, value] of formData) {
				if (typeof value === 'string') {
					url.searchParams.set(name, value);
				} else {
					console.error(`Cannot submit binary form data using GET`);
					return;
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
 * Serializes a given FormData object.
 */
function serializeFormData(fd: FormData) {
	let obj: { [key: string]: FormDataEntryValue | null } = {};
	for (let key of fd.keys()) {
		obj[key] = fd.get(key);
	}
	return obj;
}
