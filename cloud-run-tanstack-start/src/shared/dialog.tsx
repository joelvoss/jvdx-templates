import { type DialogProps, Dialog as RACDialog } from "react-aria-components";

import { clsx } from "~/lib/clsx";

/**
 * Dialog component with custom styling.
 */
export function Dialog(props: DialogProps) {
	return (
		<RACDialog
			{...props}
			className={clsx(
				"relative box-border max-h-[inherit] overflow-auto p-6 outline-0 [[data-placement]>&]:p-4",
				props.className,
			)}
		/>
	);
}
