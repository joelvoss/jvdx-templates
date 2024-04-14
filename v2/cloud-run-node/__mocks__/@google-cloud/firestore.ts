import { vi } from 'vitest';

export let Firestore = vi.fn().mockImplementation(() => {
	let document = {
		id: '04e3d6d9-8e83-4351-8f5b-59d597d0c9f7',
		data: vi
			.fn()
			.mockReturnValue({ author: 'Test Author', title: 'My test title' }),
	};

	let doc = vi.fn((id: string) => {
		return {
			get: vi.fn().mockResolvedValue(
				id === document.id
					? {
							exists: true,
							data: vi.fn().mockReturnValue(document),
						}
					: {
							exists: false,
							data: vi.fn().mockReturnValue(null),
						},
			),
			set: vi.fn().mockResolvedValue(true),
			update: vi.fn().mockResolvedValue(true),
			delete: vi.fn().mockResolvedValue(true),
		};
	});

	let collection = vi.fn().mockReturnValue({
		doc,
		get: vi.fn().mockResolvedValue({
			empty: false,
			docs: [document],
		}),
	});

	return {
		collection,
		doc,
		set: vi.fn().mockResolvedValue(true),
	};
});
