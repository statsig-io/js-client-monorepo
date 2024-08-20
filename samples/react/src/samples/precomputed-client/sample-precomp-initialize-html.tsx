/* eslint-disable no-console */
import { StatsigClient } from '@statsig/js-client';
import { AutoCapture } from '@statsig/web-analytics';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

type Bundle = {
  AutoCapture: typeof AutoCapture;
  StatsigClient: typeof StatsigClient;
};

const window = {
  Statsig: {
    StatsigClient: StatsigClient,
  } as unknown as Bundle,
};

// prettier-ignore
export default async function Sample(): Promise<void> {
  (
<div>
{/* <snippet> */}
<script src="https://cdn.jsdelivr.net/npm/@statsig/js-client@1/build/statsig-js-client.min.js"></script>
<script>
{/* </snippet> */}
  {
    (() => {
      // <snippet>
  const { StatsigClient } = window.Statsig;

  const myStatsigClient = new StatsigClient(
    YOUR_CLIENT_KEY,
    { userID: 'a-user' },
    { environment: { tier: 'development' } }
  );
  
  // initialize and wait for the latest values
  myStatsigClient.initializeAsync()
    .then(() => { 
        // render something...
    })
    .catch((err) => console.error(err));
      // </snippet>
      return <div></div>
    })()
  }
{/* <snippet> */}
</script>
{/* </snippet> */}
</div>  );
  
}
