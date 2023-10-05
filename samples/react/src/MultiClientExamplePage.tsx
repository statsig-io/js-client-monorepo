import '@react-native-async-storage/async-storage';
import { ReactNode } from 'react';

import { OnDeviceEvaluationsClient } from '@sigstat/on-device-evaluations';
import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';
import { StatsigProvider, useGate } from '@sigstat/react-bindings';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const user = { userID: 'a-user' };

const precomputedClient = new PrecomputedEvaluationsClient(
  DEMO_CLIENT_KEY,
  user,
);

const onDeviceClient = new OnDeviceEvaluationsClient(DEMO_CLIENT_KEY);

function Content() {
  const precomputedGate = useGate('a_gate');
  const onDeviceGate = useGate('a_gate', { user });

  return (
    <div
      style={{
        fontSize: '24px',
        fontFamily: 'sans-serif',
      }}
    >
      <div>Precomputed: {precomputedGate.value ? 'Passing' : 'Failing'}</div>
      <div>OnDevice: {onDeviceGate.value ? 'Passing' : 'Failing'}</div>
    </div>
  );
}

export default function MultiClientDemoPage(): ReactNode {
  return (
    <StatsigProvider
      precomputedClient={precomputedClient}
      onDeviceClient={onDeviceClient}
    >
      <Content />
    </StatsigProvider>
  );
}
