import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { FormField } from "~/shared/form-field";

////////////////////////////////////////////////////////////////////////////////

describe("FormField", () => {
	it("associates the label with a custom id and forwards input attributes", async () => {
		const screen = await render(
			<FormField
				name="isbn"
				id="book-isbn-input"
				label="ISBN"
				autoComplete="off"
				disabled
				data-testid="isbn-input"
			/>,
		);

		const input = screen.getByLabelText("ISBN");
		await expect.element(input).toHaveAttribute("id", "book-isbn-input");
		await expect.element(input).toHaveAttribute("name", "isbn");
		await expect.element(input).toHaveAttribute("autocomplete", "off");
		await expect.element(input).toHaveAttribute("data-testid", "isbn-input");
		await expect.element(input).toBeDisabled();
	});

	it("associates the label with the resolved id and forwards textarea attributes", async () => {
		const screen = await render(
			<FormField
				name="description"
				id="book-description"
				label="Description"
				type="textarea"
				rows={4}
				maxLength={500}
				readOnly
			/>,
		);

		const textarea = screen.getByLabelText("Description");
		await expect.element(textarea).toHaveAttribute("id", "book-description");
		await expect.element(textarea).toHaveAttribute("rows", "4");
		await expect.element(textarea).toHaveAttribute("maxlength", "500");
		await expect.element(textarea).toHaveAttribute("readonly");
	});
});
