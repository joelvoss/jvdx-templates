import { getLayout as getSiteLayout } from '@/layouts/site';
import { CsrfProvider } from 'src/hooks/use-csrf';
import '../styles/index.css';

function App({ Component, pageProps }) {
	const getLayout = Component.getLayout || getSiteLayout;

	return <CsrfProvider>{getLayout(<Component {...pageProps} />)}</CsrfProvider>;
}

export default App;
