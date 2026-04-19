import handler from "@tanstack/react-start/server-entry";
import { FastResponse } from "srvx";

////////////////////////////////////////////////////////////////////////////////

globalThis.Response = FastResponse;

export default {
	async fetch(request: Request) {
		return handler.fetch(request);
	},
};
