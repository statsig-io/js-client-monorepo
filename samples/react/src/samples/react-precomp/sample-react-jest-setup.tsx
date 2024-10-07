/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-inferrable-types */
import {
  StatsigProvider,
  useExperiment,
  useFeatureGate,
} from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
console.log(App);
}

// <snippet>
function Content() {
  const gate = useFeatureGate('a_gate');
  const experiment = useExperiment('an_experiment');

  return (
    <div>
      <div data-testid="gate_test">a_gate: {gate.value ? 'Pass' : 'Fail'}</div>
      <div data-testid="exp_test">
        an_experiment: {experiment.get('my_param', 'fallback')}
      </div>
    </div>
  );
}

function App() {
  return (
    <StatsigProvider
      sdkKey={YOUR_CLIENT_KEY}
      user={{ userID: 'a-user' }}
      options={{
        networkConfig: {
          // Optional - disable all network traffic in tests
          preventAllNetworkTraffic:
            typeof process !== 'undefined' &&
            process.env['NODE_ENV'] === 'test',
        },
      }}
    >
      <Content />
    </StatsigProvider>
  );
}
// </snippet>
