import { isNotFound } from "@tanstack/react-router";
import { Component, createElement, type ErrorInfo } from "react";

////////////////////////////////////////////////////////////////////////////////

export interface ErrorComponentProps {
	error: Error | null;
	reset: () => void;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback: React.ReactNode | ((props: ErrorComponentProps) => React.ReactNode);
	getResetKey?: () => number | string | undefined;
	onCatch?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
	error: Error | null;
	resetKey?: number | string;
}

/**
 * Error Boundary Component.
 * Catches errors in the component tree and renders a fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps> {
	state: ErrorBoundaryState = { error: null };

	static getDerivedStateFromProps(props: ErrorBoundaryProps) {
		return { resetKey: props.getResetKey?.() };
	}

	static getDerivedStateFromError(error: Error) {
		return { error };
	}

	reset() {
		this.setState({ error: null });
	}

	componentDidUpdate(
		_prevProps: ErrorBoundaryProps,
		prevState: ErrorBoundaryState,
	): void {
		if (prevState.error && prevState.resetKey !== this.state.resetKey) {
			this.reset();
		}
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		if (this.props.onCatch) {
			this.props.onCatch(error, errorInfo);
		}
	}

	render() {
		if (this.state.error) {
			let error: Error | null = this.state.error;
			// NOTE(joel): Customize not found errors.
			if (isNotFound(this.state.error)) {
				error = new Error("The requested resource was not found");
			}
			// NOTE(joel): If the resetKey has changed, don't render the error.
			if (this.state.resetKey !== this.props.getResetKey?.()) {
				error = null;
			}
			const errorProps = {
				error,
				reset: () => {
					this.reset();
				},
			};

			// NOTE(joel): If fallback is a function, call it with props; otherwise
			// render directly.
			if (typeof this.props.fallback === "function") {
				return createElement(this.props.fallback, errorProps);
			}
			return this.props.fallback;
		}

		return this.props.children;
	}
}
