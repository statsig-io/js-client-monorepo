import { ReactNode, useEffect } from 'react';

const SAMPLES = [
  // Precomputed Evaluations Client
  import('./samples/precomputed-client/sample-precomp-initialize'),
  import('./samples/precomputed-client/sample-precomp-basic'),
  import('./samples/precomputed-client/sample-precomp-check-gate'),
  import('./samples/precomputed-client/sample-precomp-get-config'),
  import('./samples/precomputed-client/sample-precomp-get-layer'),
  import('./samples/precomputed-client/sample-precomp-log-event'),
  import('./samples/precomputed-client/sample-precomp-shutdown'),
  import('./samples/precomputed-client/sample-precomp-bootstrap'),

  import('./samples/OnDeviceClientBasic'),
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
