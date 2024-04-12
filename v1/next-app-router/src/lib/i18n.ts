import { rosetta } from '@/lib/rosetta';
import { languages, defaultLocale } from '@/locales';

// NOTE(joel): Setup our dictionary for our rosetta stone.
let dictionary: { [key: string]: any } = {};
for (let lng of Object.values(languages)) {
	dictionary[lng.locale] = lng.dict;
}

export function getI18n(lang?: string | null) {
	if (lang == null) lang = defaultLocale;
	return rosetta(dictionary, lang);
}
