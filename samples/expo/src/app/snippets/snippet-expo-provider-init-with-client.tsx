// <snippet>
import {
  StatsigClientExpo, // StatsigClient specifically for Expo
  StatsigProviderExpo,
} from '@statsig/expo-bindings';

// </snippet>
import { DEMO_CLIENT_KEY } from '../Constants';

const YOUR_SDK_KEY = DEMO_CLIENT_KEY;

// <snippet>
const myStatsigClient = new StatsigClientExpo(YOUR_SDK_KEY, {
  userID: 'a-user',
});

export function App(): JSX.Element {
  return (
    <StatsigProviderExpo client={myStatsigClient}>
      <YourApp />
    </StatsigProviderExpo>
  );
}
// </snippet>

function YourApp(): JSX.Element | null {
  return null;
}
