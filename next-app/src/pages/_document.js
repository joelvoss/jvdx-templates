import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class CustomDocument extends Document {
	static async getInitialProps(ctx) {
		const initialProps = await Document.getInitialProps(ctx);
		return { ...initialProps, lang: ctx.query.lng };
	}

	render() {
		return (
			<Html lang={this.props.lang}>
				<Head />
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}
