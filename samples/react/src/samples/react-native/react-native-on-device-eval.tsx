/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-unsafe-return */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-empty-function */
import type {
  StatsigProviderOnDeviceEvalRN as _StatsigProviderOnDeviceEvalRN,
  useFeatureGate as _useFeatureGate,
} from '@statsig/react-native-bindings-on-device-eval';
// <snippet>
import {
  StatsigProviderOnDeviceEvalRN,
  useFeatureGate,
} from '@statsig/react-native-bindings-on-device-eval';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
console.log(App);
}

function Text(props: any) {
  return null;
}

// prettier-ignore
function Setup() {
  // </snippet>
}

// <snippet>
function Content() {
  // </snippet>

  // why? avoids issue where webpack tries to actually use this. "react is not defined"
  const useFeatureGate = (() => {}) as unknown as typeof _useFeatureGate;

  // <snippet>
  const gate = useFeatureGate('a_gate', { userID: 'a-user' });
  return <Text>a_gate: {gate ? 'Passing' : 'Failing'}</Text>;
}

function App() {
  // </snippet>

  // why? avoids issue where webpack tries to actually use this. "react is not defined"
  const StatsigProviderOnDeviceEvalRN =
    (() => {}) as unknown as typeof _StatsigProviderOnDeviceEvalRN;

  // <snippet>
  return (
    <StatsigProviderOnDeviceEvalRN
      sdkKey={YOUR_CLIENT_KEY}
      loadingComponent={<Text>...</Text>}
    >
      <Content />
    </StatsigProviderOnDeviceEvalRN>
  );
}
// </snippet>
