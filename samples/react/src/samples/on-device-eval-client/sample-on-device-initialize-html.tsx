/* eslint-disable no-console */
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';
import { AutoCapture } from '@statsig/web-analytics';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

type Bundle = {
  AutoCapture: typeof AutoCapture;
  StatsigOnDeviceEvalClient: typeof StatsigOnDeviceEvalClient;
};

const window = {
  Statsig: {
    StatsigOnDeviceEvalClient: StatsigOnDeviceEvalClient,
  } as unknown as Bundle,
};

// prettier-ignore
export default async function Sample(): Promise<void> {
  (
<div>
{/* <snippet> */}
<script src="https://cdn.jsdelivr.net/npm/@statsig/js-on-device-eval-client@1/build/statsig-js-on-device-eval-client.min.js"></script>
<script>
{/* </snippet> */}
  {
    (() => {
      // <snippet>
  const { StatsigOnDeviceEvalClient } = window.Statsig;

  const myStatsigClient = new StatsigOnDeviceEvalClient(
    YOUR_CLIENT_KEY, 
    { environment: {tier: 'development'} }
  );
  
  // initialize immediately from cache values
  myStatsigClient.initializeSync();
  
  // or, initialize and wait for the latest values
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
</div>
  );
  
}
