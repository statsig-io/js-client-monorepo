import '@react-native-async-storage/async-storage';
import { ReactNode, useEffect, useState } from 'react';

import { OnDeviceEvaluationsClient } from '@sigstat/on-device-evaluations';

import ManyChecksExample from './ManyChecksExample';
import MeasurementDetails from './MeasurementDetails';

const DEMO_CLIENT_KEY = 'client-QZ1butxQKLJVFgKJnSX6npZNVNpjACaIxjEoYSuUNLI';

const user = { userID: 'a-user' };

const client = new OnDeviceEvaluationsClient(DEMO_CLIENT_KEY);

export default function PrecomputedClientPerfExamplePage(): ReactNode {
  const [initMeasurement, setInitMeasurement] =
    useState<PerformanceMeasure | null>(null);

  useEffect(() => {
    performance.mark('precomputed-initialize-start');
    client
      .initialize()
      .then(() => {
        performance.mark('precomputed-initialize-end');
        setInitMeasurement(
          performance.measure(
            'precomputed-initialize-duration',
            'precomputed-initialize-start',
            'precomputed-initialize-end',
          ),
        );
      })
      // eslint-disable-next-line no-console
      .catch((reason) => console.error(reason));
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
          action={(i) => client.checkGate(user, `gate_num_${i}`)}
          title="Gate Checks"
          marker="precomputed-many-gates"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) =>
            client.getDynamicConfig(user, `dynamic_config_num_${i}`)
          }
          title="Dynamic Config Gets"
          marker="precomputed-many-dynamic-configs"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) => client.getExperiment(user, `experiment_num_${i}`)}
          title="Experiment Gets"
          marker="precomputed-many-experiments"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) => client.getLayer(user, `layer_num_${i}`)}
          title="Layer Gets"
          marker="precomputed-many-layers"
        />
      )}
    </>
  );
}
