import { Meta } from '../shared/meta';

export default function Custom404() {
	return (
		<>
			<Meta title="404" />

			<main className="max-w-screen-xl mx-auto px-4">
				<span className="block my-2" />
				<h1 className="text-center text-3xl font-bold text-gray-900">
					404 - Page Not Found
				</h1>
			</main>
		</>
	);
}
