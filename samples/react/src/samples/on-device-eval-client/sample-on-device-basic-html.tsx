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
<script src="https://cdn.jsdelivr.net/npm/@statsig/js-on-device-eval-client@latest/build/statsig-js-on-device-eval-client.min.js"></script>
<script>
{/* </snippet> */}
  {
    (() => {
      // <snippet>
  const { StatsigOnDeviceEvalClient } = window.Statsig;

  const client = new StatsigOnDeviceEvalClient(YOUR_CLIENT_KEY);

  client.initializeSync();

  const user = { userID: 'a-user' };

  if (client.checkGate('a_gate', user)) {
    // show new  feature
  }
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
