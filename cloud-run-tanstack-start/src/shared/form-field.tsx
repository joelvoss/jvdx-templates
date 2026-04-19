import { TextArea } from "react-aria-components";

import { clsx } from "~/lib/clsx";

////////////////////////////////////////////////////////////////////////////////

export type FormFieldProps = React.InputHTMLAttributes<HTMLInputElement> &
	React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
		name: string;
		label: string;
		type?: string;
		issue?: string;
	};

/**
 * Form Field Component.
 * Renders a labeled input or textarea with validation error display.
 */
export function FormField(props: FormFieldProps) {
	const id = props.id || props.name;
	const required = props.required || false;
	const type = props.type || "text";

	return (
		<div>
			<label
				htmlFor={props.name}
				className="mb-2 block text-sm font-medium text-gray-700"
			>
				{props.label}
				{required ? <span className="text-red-500">*</span> : null}
			</label>

			{type === "textarea" ? (
				<TextArea
					name={props.name}
					id={id}
					required={required}
					placeholder={props.placeholder}
					defaultValue={props.defaultValue}
					// NOTE(joel): field-sizing-content is required to make the textarea
					// grow with content, but it also causes the rows prop to not work,
					// so we have to set the minHeight manually based on the rows prop if
					// it's provided. We have to use the style prop since tailwind
					// doesn't support dynamic runtime values.
					style={
						props.rows
							? { minHeight: `calc(${props.rows}lh + 1rem)` }
							: undefined
					}
					className={clsx(
						"field-sizing-content w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-500",
						props.issue ? "border-red-500" : null,
					)}
				></TextArea>
			) : (
				<input
					type={type}
					name={props.name}
					id={id}
					required={required}
					placeholder={props.placeholder}
					min={props.min}
					max={props.max}
					defaultValue={props.defaultValue}
					className={clsx(
						"w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-500",
						props.issue ? "border-red-500" : null,
					)}
				/>
			)}

			{props.issue ? (
				<p className="mt-1 text-sm text-red-600">{props.issue}</p>
			) : null}
		</div>
	);
}
