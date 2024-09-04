// <snippet>
import {
  StatsigProviderExpo, // StatsigProvider specifically for Expo
} from '@statsig/expo-bindings';

// </snippet>
import { DEMO_CLIENT_KEY } from '../Constants';

const YOUR_SDK_KEY = DEMO_CLIENT_KEY;

// <snippet>
export function App(): JSX.Element {
  return (
    <StatsigProviderExpo
      sdkKey={YOUR_SDK_KEY}
      user={{ userID: 'a-user' }}
      options={{ environment: { tier: 'development' } }}
    >
      <YourApp />
    </StatsigProviderExpo>
  );
}
// </snippet>

function YourApp(): JSX.Element | null {
  return null;
}
