import { ReactNode, useEffect } from 'react';

const SAMPLES = [
  import('./samples/PrecomputedClientBasic'),
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
