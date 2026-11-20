import { TextArea } from "react-aria-components";

import { clsx } from "~/lib/clsx";

////////////////////////////////////////////////////////////////////////////////

type InputType =
	| "color"
	| "date"
	| "datetime-local"
	| "email"
	| "file"
	| "hidden"
	| "month"
	| "number"
	| "password"
	| "range"
	| "search"
	| "tel"
	| "text"
	| "time"
	| "url"
	| "week";

type BaseFormFieldProps = {
	name: string;
	label: string;
	issue?: string;
};

type TextAreaFieldProps = BaseFormFieldProps &
	Omit<
		React.ComponentProps<typeof TextArea>,
		"name" | "children" | "className" | "style"
	> & {
		type: "textarea";
		className?: string;
		style?: React.CSSProperties;
	};

type InputFieldProps = BaseFormFieldProps &
	Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type"> & {
		type?: InputType;
	};

export type FormFieldProps = InputFieldProps | TextAreaFieldProps;

/**
 * Form Field Component.
 * Renders a labeled input or textarea with validation error display.
 */
export function FormField(props: FormFieldProps) {
	const id = props.id || props.name;
	const required = props.required || false;

	return (
		<div>
			<label
				htmlFor={id}
				className="mb-2 block text-sm font-medium text-gray-700"
			>
				{props.label}
				{required ? <span className="text-red-500">*</span> : null}
			</label>

			{renderControl(props, id, required)}

			{props.issue ? (
				<p className="mt-1 text-sm text-red-600">{props.issue}</p>
			) : null}
		</div>
	);
}

////////////////////////////////////////////////////////////////////////////////

function renderControl(props: FormFieldProps, id: string, required: boolean) {
	if (props.type === "textarea") {
		const {
			name,
			label: _label,
			issue,
			id: _id,
			type: _type,
			required: _required,
			rows,
			style,
			className,
			...rest
		} = props;

		return (
			<TextArea
				{...rest}
				name={name}
				id={id}
				required={required}
				rows={rows}
				// NOTE(joel): field-sizing-content is required to make the textarea
				// grow with content, but it also causes the rows prop to not work,
				// so we have to set the minHeight manually based on the rows prop if
				// it's provided. We have to use the style prop since tailwind
				// doesn't support dynamic runtime values.
				style={rows ? { minHeight: `calc(${rows}lh + 1rem)`, ...style } : style}
				className={clsx(
					"field-sizing-content w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-500",
					issue ? "border-red-500" : null,
					className,
				)}
			/>
		);
	}

	const {
		name,
		label: _label,
		issue,
		id: _id,
		type = "text",
		required: _required,
		className,
		...rest
	} = props;

	return (
		<input
			{...rest}
			type={type}
			name={name}
			id={id}
			required={required}
			className={clsx(
				"w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-500",
				issue ? "border-red-500" : null,
				className,
			)}
		/>
	);
}
