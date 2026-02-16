// German translations. Split into multiple namespaces for better organization.
// Each namespace corresponds to a section of the application.

const head = {
	title: {
		root: "Startseite | Book Manager",
		login: "Anmeldung | Book Manager",
		books: "Bücher | Book Manager",
		bookDetails: "Buchdetails | Book Manager",
		newBook: "Neues Buch | Book Manager",
		editBook: "Buch bearbeiten | Book Manager",
	},
};

const shared = {
	navigation: {
		title: "Book Manager",
		language: {
			label: "Sprache",
			en: "EN",
			de: "DE",
		},
		nav: {
			books: "Bücher",
		},
	},
	notfound: {
		code: "404",
		title: "Seite nicht gefunden",
		goback: "Zurück gehen",
	},
	error: {
		code: "500",
		title: "Etwas ist schiefgelaufen",
		message: "Ein unerwarteter Fehler ist aufgetreten",
		goHome: "Zur Startseite",
		goBack: "Zurück gehen",
	},
	footer: {
		copy: "Book Manager — © {year}",
	},
};

const routes = {
	home: {
		title: "Willkommen beim Book Manager",
		subtitle:
			"Eine einfache und elegante Möglichkeit, deine Büchersammlung zu verwalten",
		viewBooks: "Bücher ansehen",
		addNewBook: "Neues Buch hinzufügen",
	},
	auth: {
		login: {
			title: "Anmeldung",
			placeholder: 'Hallo "/_auth/login"!',
		},
	},
	books: {
		title: "Bücher",
		editPageTitle: "Buch bearbeiten",
		addNewBook: "Neues Buch hinzufügen",
		backToBooks: "← Zurück zu den Büchern",
		backToBook: "← Zurück zum Buch",
		sort: {
			label: "Sortieren nach:",
			default: "Standard",
			title: "Titel",
			author: "Autor",
			year: "Jahr",
		},
		list: {
			empty: "Keine Bücher gefunden",
			addFirst: "Füge dein erstes Buch hinzu",
			isbnPrefix: "ISBN:",
			publishedPrefix: "Veröffentlicht:",
			errorTitle:
				"Beim Laden der Bücher ist ein unerwarteter Fehler aufgetreten.",
			errorSubtitle:
				"Bitte versuche es später erneut oder kontaktiere den Support, falls das Problem weiterhin besteht.",
			errorMessageLabel: "Fehlermeldung:",
		},
		details: {
			edit: "Bearbeiten",
			delete: "Löschen",
			author: "Autor",
			isbn: "ISBN",
			publishedYear: "Erscheinungsjahr",
			description: "Beschreibung",
			coverImage: "Coverbild",
			coverAlt: "Cover von {title}",
			created: "Erstellt: {date}",
			updated: "Zuletzt aktualisiert: {date}",
			errorTitle:
				"Beim Laden dieses Buchs ist ein unerwarteter Fehler aufgetreten.",
			errorSubtitle:
				"Bitte versuche es später erneut oder kontaktiere den Support, falls das Problem weiterhin besteht.",
			errorMessageLabel: "Fehlermeldung:",
		},
		deleteDialog: {
			toastTitle: "Buch gelöscht",
			toastDescription: 'Das Buch "{title}" wurde erfolgreich gelöscht.',
			title: "Buch löschen",
			confirm:
				'Möchtest du "<strong>{title}</strong>" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
			cancel: "Abbrechen",
			deleting: "Wird gelöscht...",
			delete: "Löschen",
		},
		form: {
			toasts: {
				createdTitle: "Buch erstellt",
				createdDescription: "Das neue Buch wurde erfolgreich erstellt.",
				updatedTitle: "Buch aktualisiert",
				updatedDescription: "Das Buch wurde erfolgreich aktualisiert.",
			},
			globalErrorTitle:
				"Das Erstellen des Buchs ist fehlgeschlagen. Bitte korrigiere den folgenden Fehler:",
			fields: {
				title: "Titel",
				author: "Autor",
				isbn: "ISBN",
				publishedYear: "Erscheinungsjahr",
				description: "Beschreibung",
				coverImageUrl: "Coverbild-URL",
			},
			placeholders: {
				isbn: "978-0-123456-78-9",
				coverImageUrl: "https://example.com/cover.jpg",
			},
			validation: {
				titleMin: "Der Titel muss mindestens 2 Zeichen lang sein",
				authorMin: "Der Autor muss mindestens 2 Zeichen lang sein",
				isbnInvalid:
					"Die ISBN muss gültig sein (10 oder 13 Ziffern, Bindestriche optional)",
				publishedYearRange:
					"Das Erscheinungsjahr muss zwischen 1000 und {year} liegen",
				descriptionMin:
					"Die Beschreibung muss, falls angegeben, mindestens 10 Zeichen lang sein",
				coverImageUrlInvalid: "Die Coverbild-URL muss eine gültige URL sein",
			},
			actions: {
				saving: "Wird gespeichert...",
				create: "Buch erstellen",
				save: "Änderungen speichern",
				cancel: "Abbrechen",
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
