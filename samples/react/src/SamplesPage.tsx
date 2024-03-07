import { ReactNode, useEffect } from 'react';

const SAMPLES = [
  // Precomputed Evaluations Client
  import('./samples/precomputed-client/PrecomputedInitialize'),
  import('./samples/precomputed-client/PrecomputedClientBasic'),
  import('./samples/precomputed-client/PrecomputedClientCheckGate'),
  import('./samples/precomputed-client/PrecomputedClientGetDynamicConfig'),
  import('./samples/precomputed-client/PrecomputedClientGetLayer'),
  import('./samples/precomputed-client/PrecomputedClientGetLogEvent'),
  import('./samples/precomputed-client/PrecomputedClientShutdown'),

  import('./samples/OnDeviceClientBasic'),
  import('./samples/BootstrapInit'),
];

export default function SamplesPage(): ReactNode {
  useEffect(() => {
    (async () => {
      for await (const { default: sample } of SAMPLES) {
        await sample(); // ensure it runs
      }
    })().catch((e) => {
      throw e;
    });
  }, []);

  return <div>See Console</div>;
}
