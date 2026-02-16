import { forwardRef, useLayoutEffect, useRef } from "react";

import { useComposedRef } from "~/hooks/use-composed-ref";
import { useListener } from "~/hooks/use-listener";
import { pick } from "~/lib/pick";

////////////////////////////////////////////////////////////////////////////////

const isBrowser = typeof document !== "undefined";

////////////////////////////////////////////////////////////////////////////////

type TextareaHTMLAttributes = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type Style = Omit<
	NonNullable<TextareaHTMLAttributes["style"]>,
	"maxHeight" | "minHeight"
> & {
	height?: number;
};

export type TextareaHeightChangeMeta = {
	rowHeight: number;
};

export interface TextareaProps extends Omit<TextareaHTMLAttributes, "style"> {
	maxRows?: number;
	minRows?: number;
	onHeightChange?: (height: number, meta: TextareaHeightChangeMeta) => void;
	cacheMeasurements?: boolean;
	style?: Style;
}

////////////////////////////////////////////////////////////////////////////////

function TextareaImpl(
	props: TextareaProps,
	userRef: React.Ref<HTMLTextAreaElement>,
) {
	const {
		cacheMeasurements,
		maxRows,
		minRows,
		onChange = () => {},
		onHeightChange = () => {},
		...rest
	} = props;

	const isControlled = rest.value !== undefined;
	const libRef = useRef<HTMLTextAreaElement>(null);
	const ref = useComposedRef(libRef, userRef);
	const heightRef = useRef(0);
	const measurementsCacheRef = useRef<SizingData>(null);

	const resizeTextarea = () => {
		const node = libRef.current!;
		const nodeSizingData =
			cacheMeasurements && measurementsCacheRef.current
				? measurementsCacheRef.current
				: getSizingData(node);

		if (!nodeSizingData) {
			return;
		}

		measurementsCacheRef.current = nodeSizingData;

		const [height, rowHeight] = calculateNodeHeight(
			nodeSizingData,
			node.value || node.placeholder || "x",
			minRows,
			maxRows,
		);

		if (heightRef.current !== height) {
			heightRef.current = height;
			node.style.setProperty("height", `${height}px`, "important");
			onHeightChange(height, { rowHeight });
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (!isControlled) {
			resizeTextarea();
		}
		onChange(e);
	};

	if (isBrowser) {
		useLayoutEffect(resizeTextarea);

		// NOTE(joel): Listen for form reset events to resize the textarea.
		useListener(document.body, "reset", (ev) => {
			if (libRef.current!.form !== ev.target) return;
			if (isControlled) return;

			const currentValue = libRef.current!.value;
			requestAnimationFrame(() => {
				const node = libRef.current;
				if (node && currentValue !== node.value) {
					resizeTextarea();
				}
			});
		});

		// NOTE(joel): Listen for window resize and font load events to resize the
		// textarea.
		useListener(window, "resize", resizeTextarea);
		useListener(document.fonts, "loadingdone", resizeTextarea);

		return <textarea {...rest} onChange={handleChange} ref={ref} />;
	}

	return <textarea {...rest} onChange={handleChange} ref={ref} />;
}

export const Textarea = forwardRef(TextareaImpl);

////////////////////////////////////////////////////////////////////////////////

const SIZING_STYLE = [
	"borderBottomWidth",
	"borderLeftWidth",
	"borderRightWidth",
	"borderTopWidth",
	"boxSizing",
	"fontFamily",
	"fontSize",
	"fontStyle",
	"fontWeight",
	"letterSpacing",
	"lineHeight",
	"paddingBottom",
	"paddingLeft",
	"paddingRight",
	"paddingTop",
	// non-standard
	"tabSize",
	"textIndent",
	// non-standard
	"textRendering",
	"textTransform",
	"width",
	"wordBreak",
	"wordSpacing",
	"scrollbarGutter",
] as const;

type SizingProps = Extract<
	(typeof SIZING_STYLE)[number],
	keyof CSSStyleDeclaration
>;

interface SizingData {
	sizingStyle: Pick<CSSStyleDeclaration, SizingProps>;
	paddingSize: number;
	borderSize: number;
}

const isIE = isBrowser
	? !!(document.documentElement as any).currentStyle
	: false;

/**
 * Gets the sizing data for a given HTML element.
 * This includes the relevant CSS properties needed to calculate
 * the height of a textarea, as well as padding and border sizes.
 */
function getSizingData(node: HTMLElement) {
	const style = window.getComputedStyle(node);
	if (style === null) return null;

	const sizingStyle = pick(SIZING_STYLE as unknown as SizingProps[], style);
	const { boxSizing } = sizingStyle;

	// NOTE(joel): If boxSizing is empty, the node is likely detached from the DOM
	// and computed dimensions cannot be read.
	if (boxSizing === "") return null;

	// NOTE(joel): IE returns content width as the computed width, unlike Edge
	// which handles this correctly. We need to manually add padding and border
	// widths.
	if (isIE && boxSizing === "border-box") {
		sizingStyle.width =
			parseFloat(sizingStyle.width!) +
			parseFloat(sizingStyle.borderRightWidth!) +
			parseFloat(sizingStyle.borderLeftWidth!) +
			parseFloat(sizingStyle.paddingRight!) +
			parseFloat(sizingStyle.paddingLeft!) +
			"px";
	}

	const paddingSize =
		parseFloat(sizingStyle.paddingBottom!) +
		parseFloat(sizingStyle.paddingTop!);

	const borderSize =
		parseFloat(sizingStyle.borderBottomWidth!) +
		parseFloat(sizingStyle.borderTopWidth!);

	return {
		sizingStyle,
		paddingSize,
		borderSize,
	};
}

////////////////////////////////////////////////////////////////////////////////

const HIDDEN_TEXTAREA_STYLE = {
	"min-height": "0",
	"max-height": "none",
	height: "0",
	visibility: "hidden",
	overflow: "hidden",
	position: "absolute",
	"z-index": "-1000",
	top: "0",
	right: "0",
	display: "block",
	"pointer-events": "none",
} as const;

/**
 * Applies hidden styles to a textarea element to prepare it for off-screen
 * height calculation.
 */
function forceHiddenStyles(node: HTMLElement) {
	for (let key of Object.keys(HIDDEN_TEXTAREA_STYLE)) {
		node.style.setProperty(
			key,
			HIDDEN_TEXTAREA_STYLE[key as keyof typeof HIDDEN_TEXTAREA_STYLE],
			"important",
		);
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Calculates the height of a textarea node based on its content and sizing
 * data. Accounts for box-sizing, padding, borders, and row constraints.
 */
function getHeight(node: HTMLElement, sizingData: SizingData) {
	const height = node.scrollHeight;
	if (sizingData.sizingStyle.boxSizing === "border-box") {
		// NOTE(joel): border-box: add border, since
		// height = content + padding + border
		return height + sizingData.borderSize;
	}
	// NOTE(joel): Remove padding, since height = content
	return height - sizingData.paddingSize;
}

////////////////////////////////////////////////////////////////////////////////

let hiddenTextarea: HTMLTextAreaElement | null = null;

/**
 * Calculates the appropriate height for a textarea based on its content,
 * sizing data, and row constraints.
 */
function calculateNodeHeight(
	sizingData: SizingData,
	value: string,
	minRows = 1,
	maxRows = Infinity,
) {
	if (!hiddenTextarea) {
		hiddenTextarea = document.createElement("textarea");
		hiddenTextarea.setAttribute("tabindex", "-1");
		hiddenTextarea.setAttribute("aria-hidden", "true");
		hiddenTextarea.setAttribute("id", "__react_textarea_height_calculator__");
		hiddenTextarea.setAttribute("disabled", "true");
		forceHiddenStyles(hiddenTextarea);
	}

	if (hiddenTextarea.parentNode === null) {
		document.body.appendChild(hiddenTextarea);
	}

	const { paddingSize, borderSize, sizingStyle } = sizingData;
	const { boxSizing } = sizingStyle;

	for (let _key of Object.keys(sizingStyle)) {
		const key = _key as keyof typeof sizingStyle;
		hiddenTextarea!.style[key] = sizingStyle[key] as any;
	}

	forceHiddenStyles(hiddenTextarea);

	hiddenTextarea.value = value;
	let height = getHeight(hiddenTextarea, sizingData);
	// NOTE(joel): Set value and calculate height twice to work around a Firefox
	// rendering bug. @see https://bugzilla.mozilla.org/show_bug.cgi?id=1795904
	hiddenTextarea.value = value;
	height = getHeight(hiddenTextarea, sizingData);

	// NOTE(joel): Calculate the height of a single row by measuring a textarea
	// containing one character.
	hiddenTextarea.value = "x";
	const rowHeight = hiddenTextarea.scrollHeight - paddingSize;

	let minHeight = rowHeight * minRows;
	if (boxSizing === "border-box") {
		minHeight = minHeight + paddingSize + borderSize;
	}
	height = Math.max(minHeight, height);

	let maxHeight = rowHeight * maxRows;
	if (boxSizing === "border-box") {
		maxHeight = maxHeight + paddingSize + borderSize;
	}
	height = Math.min(maxHeight, height);

	return [height, rowHeight];
}
