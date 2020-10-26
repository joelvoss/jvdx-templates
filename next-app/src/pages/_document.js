import Document, { Html, Head, Main, NextScript } from 'next/document';

class CustomDocument extends Document {
	static async getInitialProps(ctx) {
		const initialProps = await Document.getInitialProps(ctx);
		return { ...initialProps };
	}

	render() {
		return (
			<Html>
				<Head />
				<body className="bg-white">
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default CustomDocument;
