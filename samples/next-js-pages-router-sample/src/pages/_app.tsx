import { AppProps } from 'next/app';

import {
  StatsigOptions,
  StatsigProvider,
  useClientAsyncInit,
  useClientBootstrapInit,
} from '@statsig/react-bindings';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';

import { StatsigServerProps } from '../lib/statsig-backend';
import './styles.css';

const USE_BOOTSTRAP_INIT = false;
const DEFAULT_EXPORT = USE_BOOTSTRAP_INIT ? BootstrapInitApp : AsyncInitApp;

function makeStatsigOptions(host: string): StatsigOptions {
  return {
    disableStatsigEncoding: true,
    disableCompression: true,
    networkConfig: {
      logEventUrl: `${host}/api/statsig-proxy/log_event`,
      initializeUrl: `${host}/api/statsig-proxy/initialize`,
    },
    plugins: [new StatsigAutoCapturePlugin()],
  };
}

function BootstrapInitApp({
  Component,
  pageProps,
}: AppProps<{ statsigProps: StatsigServerProps }>): React.ReactElement {
  const { user, key, data, host } = pageProps.statsigProps;
  const client = useClientBootstrapInit(
    key,
    user,
    data,
    makeStatsigOptions(host ?? ''),
  );

  return (
    <StatsigProvider client={client}>
      <Component {...pageProps} />
    </StatsigProvider>
  );
}

function AsyncInitApp({
  Component,
  pageProps,
}: AppProps<{ statsigProps: StatsigServerProps }>): React.ReactElement {
  const key =
    process.env['NEXT_PUBLIC_STATSIG_CLIENT_KEY'] ??
    'No Statsig Client Key Provided';

  const { client } = useClientAsyncInit(
    key,
    { userID: 'a-user' },
    makeStatsigOptions(pageProps.statsigProps?.host ?? ''),
  );

  return (
    <StatsigProvider client={client} loadingComponent={<div>Loading...</div>}>
      <Component {...pageProps} />
    </StatsigProvider>
  );
}

export default DEFAULT_EXPORT;
