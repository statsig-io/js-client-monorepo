/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-inferrable-types */
// <snippet>
import { StatsigProvider, useClientAsyncInit } from '@statsig/react-bindings';
import { StatsigSessionReplayPlugin } from '@statsig/session-replay';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
  console.log(App);
  }

// prettier-ignore
// <snippet>
function App() {
  const { client } = useClientAsyncInit(
    YOUR_CLIENT_KEY,
    { userID: 'a-user' },
    { plugins: [ new StatsigSessionReplayPlugin() ] },
  );

  return (
    <StatsigProvider client={client} loadingComponent={<div>Loading...</div>}>
      <div>Hello World</div>
    </StatsigProvider>
  );
}
// </snippet>
