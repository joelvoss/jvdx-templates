import {
	ModalOverlay,
	ModalOverlayProps,
	Modal as RACModal,
} from "react-aria-components";

////////////////////////////////////////////////////////////////////////////////

/**
 * A modal component using React Aria's Modal with custom styles.
 */
export function Modal(props: ModalOverlayProps) {
	const { isOpen, isDismissable, onOpenChange, ...rest } = props;

	const overlayProps = { isOpen, isDismissable, onOpenChange };

	return (
		<ModalOverlay
			{...overlayProps}
			{...rest}
			className="diration-200 absolute top-0 left-0 isolate z-20 h-(--page-height) w-full bg-black/50 text-center backdrop-blur-lg entering:ease-out entering:animate-in entering:fade-in exiting:ease-in exiting:animate-out exiting:fade-out"
		>
			<div className="sticky top-0 left-0 w-full h-(--visual-viewport-height) flex items-center justify-center box-border">
				<RACModal
					{...rest}
					className="max-h-[calc(var(--visual-viewport-height)*.9)] w-full max-w-[min(90vw,450px)] rounded-2xl border border-black/10 bg-white bg-clip-padding text-left align-middle font-sans text-neutral-700 shadow-2xl duration-200 forced-colors:bg-[Canvas] entering:ease-out entering:animate-in entering:zoom-in-105 exiting:ease-in exiting:animate-out exiting:zoom-out-95"
				/>
			</div>
		</ModalOverlay>
	);
}
