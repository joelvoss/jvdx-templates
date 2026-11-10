import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

import { recordMutation, recordRead } from "./auth-execution-state";

export const readFixture = createServerFn({ method: "GET" }).handler(() =>
	Response.json(recordRead()),
);

export const mutationFixture = createServerFn({ method: "POST" })
	.validator(
		v.pipe(
			v.instance(FormData),
			v.transform((data) => ({ value: data.get("value") })),
			v.object({ value: v.pipe(v.string(), v.minLength(1)) }),
		),
	)
	.handler(({ data }) => Response.json(recordMutation(data.value)));
