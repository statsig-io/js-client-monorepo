import '@react-native-async-storage/async-storage';
import { ReactNode, useEffect, useState } from 'react';

import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';

import ManyChecksExample from './ManyChecksExample';
import MeasurementDetails from './MeasurementDetails';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const user = { userID: 'a-user' };

const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, user);

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
          action={(i) => client.checkGate(`gate_num_${i}`)}
          title="Gate Checks"
          marker="precomputed-many-gates"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) => client.getDynamicConfig(`dynamic_config_num_${i}`)}
          title="Dynamic Config Gets"
          marker="precomputed-many-dynamic-configs"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) => client.getExperiment(`experiment_num_${i}`)}
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
