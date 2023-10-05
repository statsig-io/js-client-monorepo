import '@react-native-async-storage/async-storage';
import { ReactNode, useEffect, useState } from 'react';

import { OnDeviceEvaluationsClient } from '@sigstat/on-device-evaluations';

import ManyChecksExample from './ManyChecksExample';
import MeasurementDetails from './MeasurementDetails';

const DEMO_CLIENT_KEY = 'client-QZ1butxQKLJVFgKJnSX6npZNVNpjACaIxjEoYSuUNLI';

const user = { userID: 'a-user' };

const client = new OnDeviceEvaluationsClient(DEMO_CLIENT_KEY);

export default function OnDeviceClientPerfExamplePage(): ReactNode {
  const [initMeasurement, setInitMeasurement] =
    useState<PerformanceMeasure | null>(null);

  useEffect(() => {
    performance.mark('on-device-initialize-start');
    client
      .initialize()
      .then(() => {
        performance.mark('on-device-initialize-end');
        setInitMeasurement(
          performance.measure(
            'on-device-initialize-duration',
            'on-device-initialize-start',
            'on-device-initialize-end',
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
          action={(i) =>
            client.checkGate({ userID: `user_${i}` }, 'partial_gate')
          }
          title="Gate Checks"
          marker="on-device-many-gates"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) =>
            client.getDynamicConfig(user, `dynamic_config_num_${i}`)
          }
          title="Dynamic Config Gets"
          marker="on-device-many-dynamic-configs"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) =>
            client.getExperiment({ userID: `user_${i}` }, 'an_experiment')
          }
          title="Experiment Gets"
          marker="on-device-many-experiments"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) => client.getLayer(user, `layer_num_${i}`)}
          title="Layer Gets"
          marker="on-device-many-layers"
        />
      )}
    </>
  );
}
