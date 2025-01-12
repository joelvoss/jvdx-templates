import { getLayout as getSiteLayout } from '@/layouts/site';
import { CsrfProvider } from '@/hooks/use-csrf';
import { isFunction } from '@/lib/assertions';
import '../styles/index.css';

import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import type { ReactNode, JSX } from 'react';

type NextPageWithLayout = NextPage & {
	getLayout?: (page: ReactNode) => JSX.Element;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
};

function App({ Component, pageProps }: AppPropsWithLayout) {
	const getLayout = isFunction(Component.getLayout)
		? Component.getLayout
		: getSiteLayout;

	return <CsrfProvider>{getLayout(<Component {...pageProps} />)}</CsrfProvider>;
}

export default App;
