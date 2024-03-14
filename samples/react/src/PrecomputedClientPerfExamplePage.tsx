import { ReactNode, useEffect, useState } from 'react';

import { StatsigClient } from '@statsig/js-client';

import ManyChecksExample from './ManyChecksExample';
import MeasurementDetails from './MeasurementDetails';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const user = { userID: 'a-user' };

const client = new StatsigClient(DEMO_CLIENT_KEY, user);

export default function PrecomputedClientPerfExamplePage(): ReactNode {
  const [initMeasurement, setInitMeasurement] =
    useState<PerformanceMeasure | null>(null);

  useEffect(() => {
    performance.mark('precomputed-initialize-start');
    client.initializeSync();

    performance.mark('precomputed-initialize-end');
    setInitMeasurement(
      performance.measure(
        'precomputed-initialize-duration',
        'precomputed-initialize-start',
        'precomputed-initialize-end',
      ),
    );
  }, []);

  return (
    <>
      {initMeasurement && (
        <MeasurementDetails
          title={'Initialize Measurement'}
          measurement={initMeasurement}
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) =>
            client.checkGate(i % 2 === 0 ? 'partial_gate' : 'a_gate')
          }
          title="Gate Checks"
          marker="precomputed-many-gates"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(_i) => client.getDynamicConfig('a_dynamic_config')}
          title="Dynamic Config Gets"
          marker="precomputed-many-dynamic-configs"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(_i) => client.getExperiment('an_experiment')}
          title="Experiment Gets"
          marker="precomputed-many-experiments"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) => client.getLayer(`layer_num_${i}`)}
          title="Layer Gets"
          marker="precomputed-many-layers"
        />
      )}
    </>
  );
}
