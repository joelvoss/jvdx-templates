// English translations. Split into multiple namespaces for better organization.
// Each namespace corresponds to a section of the application.

const head = {
	title: {
		root: "Home | Book Manager",
		login: "Login | Book Manager",
		books: "Books | Book Manager",
		bookDetails: "Book Details | Book Manager",
		newBook: "New Book | Book Manager",
		editBook: "Edit Book | Book Manager",
	},
};

const shared = {
	navigation: {
		title: "Book Manager",
		language: {
			label: "Language",
			en: "EN",
			de: "DE",
		},
		nav: {
			books: "Books",
		},
	},
	notfound: {
		code: "404",
		title: "Page Not Found",
		goback: "Go back",
	},
	error: {
		code: "500",
		title: "Something went wrong",
		message: "An unexpected error occurred",
		goHome: "Go to homepage",
		goBack: "Go back",
	},
	footer: {
		copy: "Book Manager — © {year}",
	},
};

const routes = {
	home: {
		title: "Welcome to Book Manager",
		subtitle: "A simple and elegant way to manage your book collection",
		viewBooks: "View Books",
		addNewBook: "Add New Book",
	},
	auth: {
		login: {
			title: "Login",
			placeholder: 'Hello "/_auth/login"!',
		},
	},
	books: {
		title: "Books",
		editPageTitle: "Edit Book",
		addNewBook: "Add New Book",
		backToBooks: "← Back to Books",
		backToBook: "← Back to Book",
		sort: {
			label: "Sort by:",
			default: "Default",
			title: "Title",
			author: "Author",
			year: "Year",
		},
		list: {
			empty: "No books found",
			addFirst: "Add your first book",
			isbnPrefix: "ISBN:",
			publishedPrefix: "Published:",
			errorTitle: "There was an unexpected error loading the books.",
			errorSubtitle:
				"Please try again later or contact support if the problem persists.",
			errorMessageLabel: "Error message:",
		},
		details: {
			edit: "Edit",
			delete: "Delete",
			author: "Author",
			isbn: "ISBN",
			publishedYear: "Published Year",
			description: "Description",
			coverImage: "Cover Image",
			coverAlt: "Cover of {title}",
			created: "Created: {date}",
			updated: "Last updated: {date}",
			errorTitle: "There was an unexpected error loading this book.",
			errorSubtitle:
				"Please try again later or contact support if the problem persists.",
			errorMessageLabel: "Error message:",
		},
		deleteDialog: {
			toastTitle: "Book Deleted",
			toastDescription: 'The book "{title}" has been successfully deleted.',
			title: "Delete Book",
			confirm:
				'Are you sure you want to delete "<strong>{title}</strong>"? This action cannot be undone.',
			cancel: "Cancel",
			deleting: "Deleting...",
			delete: "Delete",
		},
		form: {
			toasts: {
				createdTitle: "Book Created",
				createdDescription: "The new book has been successfully created.",
				updatedTitle: "Book Updated",
				updatedDescription: "The book has been successfully updated.",
			},
			globalErrorTitle:
				"Book creation failed. Please correct the following error:",
			fields: {
				title: "Title",
				author: "Author",
				isbn: "ISBN",
				publishedYear: "Published Year",
				description: "Description",
				coverImageUrl: "Cover Image URL",
			},
			placeholders: {
				isbn: "978-0-123456-78-9",
				coverImageUrl: "https://example.com/cover.jpg",
			},
			validation: {
				titleMin: "Title must be at least 2 characters long",
				authorMin: "Author must be at least 2 characters long",
				isbnInvalid: "ISBN must be valid (10 or 13 digits, hyphens optional)",
				publishedYearRange: "Published year must be between 1000 and {year}",
				descriptionMin:
					"Description must be at least 10 characters long if provided",
				coverImageUrlInvalid: "Cover image URL must be a valid URL",
			},
			actions: {
				saving: "Saving...",
				create: "Create Book",
				save: "Save Changes",
				cancel: "Cancel",
			},
		},
	},
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Exports all messages.
 */
export default {
	head,
	shared,
	routes,
};
