/* eslint-disable no-console */
import { StatsigClient } from '@statsig/js-client';
import { StatsigSessionReplayPlugin } from '@statsig/session-replay';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

type Bundle = {
  StatsigClient: typeof StatsigClient;
  StatsigSessionReplayPlugin: typeof StatsigSessionReplayPlugin;
  StatsigAutoCapturePlugin: typeof StatsigAutoCapturePlugin;
};

const noop = () => {
  //
};

const window = {
  myStatsigClient: {} as StatsigClient,
  Statsig: {
    StatsigClient,
    StatsigSessionReplayPlugin: noop,
    StatsigAutoCapturePlugin: noop,
  } as unknown as Bundle,
};

// prettier-ignore
export default async function Sample(): Promise<void> {
  (
<div>
{/* <snippet> */}
<script src="https://cdn.jsdelivr.net/npm/@statsig/js-client@3/build/statsig-js-client+session-replay+web-analytics.min.js"></script>
<script>
{/* </snippet> */}
  {
    (() => {
      // <snippet>
  const { StatsigClient, StatsigAutoCapturePlugin, StatsigSessionReplayPlugin } = window.Statsig;

  
  const client = new StatsigClient(
    YOUR_CLIENT_KEY,       // put your client sdk key here - "client-XXXX"
    { userID: 'optional' }, // set a userID here if you have one
    { plugins: [
      new StatsigAutoCapturePlugin(),
      new StatsigSessionReplayPlugin()
    ]}
  ); 


  client.initializeAsync().catch((err) => console.error(err));
      // </snippet>
      return <div></div>
    })()
  }
{/* <snippet> */}
</script>
{/* </snippet> */}
</div>
  );
  
}
