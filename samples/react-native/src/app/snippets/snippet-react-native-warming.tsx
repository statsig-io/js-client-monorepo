// <snippet>
import { StatsigClient } from '@statsig/js-client';
import {
  StatsigProviderRN, // StatsigProvider specifically for RN
  warmCachingFromAsyncStorage,
} from '@statsig/react-native-bindings';

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
    <StatsigProviderRN client={myStatsigClient} cacheWarming={warming}>
      <YourApp />
    </StatsigProviderRN>
  );
}

function YourApp(): JSX.Element | null {
  return null;
}
