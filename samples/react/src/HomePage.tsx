import '@react-native-async-storage/async-storage';

import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';
import { StatsigProvider, useGate } from '@sigstat/react-bindings';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';
const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, {
  userID: 'a-user',
});

function Content() {
  const { value } = useGate('a_gate');

  return (
    <div
      style={{
        fontSize: '24px',
        fontFamily: 'sans-serif',
      }}
    >
      {value ? 'Passing' : 'Failing'}
      <div>
        <ul>
          <li>
            <a href="/examples/multiple-clients">Multiple Clients</a>
          </li>
          <li>
            <a href="/examples/precomputed-eval-performance">
              Precomputed Evaluations Performance
            </a>
          </li>
          <li>
            <a href="/examples/on-device-eval-performance">
              On Device Evaluations Performance
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
