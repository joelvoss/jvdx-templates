import { Meta } from '../shared/meta';

export default function Error({ statusCode }) {
	return (
		<>
			<Meta title={statusCode} />

			<main className="max-w-screen-xl mx-auto px-4">
				<span className="block my-2" />
				<h1 className="text-center text-3xl font-bold text-gray-900">
					{statusCode
						? `An error ${statusCode} occurred on server`
						: 'An error occurred on client'}
				</h1>
			</main>
		</>
	);
}

Error.getInitialProps = ({ res, err }) => {
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
	return { statusCode };
};
