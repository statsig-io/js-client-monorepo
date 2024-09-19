/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-inferrable-types */
// <snippet>
import { useEffect } from 'react';

import { StatsigProvider, useStatsigClient } from '@statsig/react-bindings';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
  console.log(App);
  console.log(MyComponent);
  }

// <snippet>
function App() {
  return (
    <StatsigProvider
      sdkKey={YOUR_CLIENT_KEY}
      user={{
        customIDs: {
          stableID: 'my-custom-stable-id', // <- Your Stable ID (Must have key "stableID")
        },
      }}
    >
      <div>Hello World</div>
    </StatsigProvider>
  );
}

// or, if you already have an initialized client, you can update the user instead
function MyComponent() {
  const { client } = useStatsigClient();
  useEffect(() => {
    client
      .updateUserAsync({
        customIDs: {
          stableID: 'my-custom-stable-id', // <- Your Stable ID (Must have key "stableID")
        },
      })
      .catch((err) => console.error(err));
  }, [client]);
}
// </snippet>
