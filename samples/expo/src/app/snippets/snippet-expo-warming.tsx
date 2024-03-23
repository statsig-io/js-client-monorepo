// <snippet>
import {
  StatsigProviderExpo, // StatsigProvider specifically for Expo
  warmCachingFromAsyncStorage,
} from '@statsig/expo-bindings';
import { StatsigClient } from '@statsig/js-client';

// </snippet>
import { DEMO_CLIENT_KEY } from '../Constants';

const YOUR_SDK_KEY = DEMO_CLIENT_KEY;

// <snippet>
const myStatsigClient = new StatsigClient(YOUR_SDK_KEY, {
  userID: 'a-user',
});

const warming = warmCachingFromAsyncStorage(myStatsigClient);
// </snippet>

export function App(): JSX.Element {
  return (
    <StatsigProviderExpo client={myStatsigClient} cacheWarming={warming}>
      <YourApp />
    </StatsigProviderExpo>
  );
}

function YourApp(): JSX.Element | null {
  return null;
}
