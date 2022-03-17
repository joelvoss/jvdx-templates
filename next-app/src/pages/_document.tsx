import Document, { Html, Head, Main, NextScript } from 'next/document';

import type { DocumentContext } from 'next/document';

type InitialProps = {
	lang: string;
};

export default class CustomDocument extends Document<InitialProps> {
	static async getInitialProps(ctx: DocumentContext) {
		const initialProps = await Document.getInitialProps(ctx);
		return { ...initialProps, lang: ctx.query.lng as string };
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
