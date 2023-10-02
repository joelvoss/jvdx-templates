import 'server-only';

/**
 * Fetches repository data from the Github API.
 */
export async function getRepo(repo: string) {
	const url = `https://api.github.com/repos/${repo}`;

	try {
		const res = await fetch(url, { method: 'GET' });
		if (res.status !== 200) {
			throw new Error(
				`Failed to fetch data for "${url}". Status: ${res.status}`,
			);
		}

		const json = await res.json();

		return {
			name: json.name,
			url: json.html_url,
			description: json.description,
			stargazers_count: json.stargazers_count,
			watchers_count: json.watchers_count,
		};
	} catch (err: any) {
		console.error(err.message);
		throw new Error(`Failed to fetch page data. Reason: '${err.message}'`);
	}
}

////////////////////////////////////////////////////////////////////////////////

export const Github = {
	getRepo,
};
