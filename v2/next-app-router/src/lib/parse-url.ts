const HTTPRegExp = /^http:\/\//;
const HTTPSRegExp = /^https?:\/\//;
const TrailingSlashRegExp = /\/$/;

/**
 * parseURL parses a input `url` into both `baseURL` and `basePath`.
 */
export function parseURL(url?: string) {
	const defaultProtocol = 'http://';
	const defaultHost = 'localhost:3000';
	const defaultPath = '/';

	let _url = `${defaultProtocol}${defaultHost}${defaultPath}`;
	if (url !== defaultHost && url != null) {
		_url = url;
	}

	// NOTE(joel): Default to HTTPS if no protocol explictly specified
	const protocol = _url.match(HTTPRegExp) ? 'http' : 'https';

	// NOTE(joel): Normalize URLs by stripping protocol and no trailing slash
	_url = _url.replace(HTTPSRegExp, '').replace(TrailingSlashRegExp, '');

	// NOTE(joel): Simple split based on first `/`
	const [_host, ..._path] = _url.split('/');

	const baseURL = _host ? `${protocol}://${_host}` : defaultHost;
	const basePath = _path.length > 0 ? `/${_path.join('/')}` : defaultPath;

	return { baseURL, basePath };
}
