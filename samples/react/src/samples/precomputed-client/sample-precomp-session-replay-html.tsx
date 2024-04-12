/* eslint-disable no-console */
import { StatsigClient } from '@statsig/js-client';
import { SessionReplay } from '@statsig/session-replay';
import { AutoCapture } from '@statsig/web-analytics';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

type Bundle = {
  SessionReplay: typeof SessionReplay;
  AutoCapture: typeof AutoCapture;
  StatsigClient: typeof StatsigClient;
};

class Dummy {}

const window = {
  myStatsigClient: {} as StatsigClient,
  Statsig: {
    StatsigClient,
    AutoCapture,
    SessionReplay: Dummy as unknown as SessionReplay,
  } as unknown as Bundle,
};

// prettier-ignore
export default async function Sample(): Promise<void> {
  (
<div>
{/* <snippet> */}
<script src="https://cdn.jsdelivr.net/npm/@statsig/js-client@latest/build/statsig-js-client+session-replay+web-analytics.min.js"></script>
<script>
{/* </snippet> */}
  {
    (() => {
      // <snippet>
  const { StatsigClient, AutoCapture, SessionReplay } = window.Statsig;

  const client = new StatsigClient(YOUR_CLIENT_KEY, { userID: 'a-user' });

  new AutoCapture(client);
  new SessionReplay(client);

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
