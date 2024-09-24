/* eslint-disable no-console */
import { StatsigClient } from '@statsig/js-client';
import { runStatsigSessionReplay } from '@statsig/session-replay';
import { runStatsigAutoCapture } from '@statsig/web-analytics';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

type Bundle = {
  StatsigClient: typeof StatsigClient;
  runStatsigSessionReplay: typeof runStatsigSessionReplay;
  runStatsigAutoCapture: typeof runStatsigAutoCapture;
};

const noop = () => {
  //
};

const window = {
  myStatsigClient: {} as StatsigClient,
  Statsig: {
    StatsigClient,
    runStatsigSessionReplay: noop,
    runStatsigAutoCapture: noop,
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
  const { StatsigClient, runStatsigAutoCapture, runStatsigSessionReplay } = window.Statsig;

  
  const client = new StatsigClient(
    YOUR_CLIENT_KEY,       // put your client sdk key here - "client-XXXX"
    { userID: 'optional' } // set a userID here if you have one
  ); 

  runStatsigAutoCapture(client);
  runStatsigSessionReplay(client);

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
