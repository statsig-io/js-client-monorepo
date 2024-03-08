import { ReactNode, useEffect, useState } from 'react';

import { OnDeviceEvaluationsClient } from '@statsig/on-device-evaluations';

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
    client.initialize();
    performance.mark('on-device-initialize-end');
    setInitMeasurement(
      performance.measure(
        'on-device-initialize-duration',
        'on-device-initialize-start',
        'on-device-initialize-end',
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
            client.checkGate('partial_gate', { userID: `user_${i}` })
          }
          title="Gate Checks"
          marker="on-device-many-gates"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) =>
            client.getDynamicConfig(`dynamic_config_num_${i}`, user)
          }
          title="Dynamic Config Gets"
          marker="on-device-many-dynamic-configs"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) =>
            client.getExperiment('an_experiment', { userID: `user_${i}` })
          }
          title="Experiment Gets"
          marker="on-device-many-experiments"
        />
      )}

      {initMeasurement && (
        <ManyChecksExample
          action={(i) => client.getLayer(`layer_num_${i}`, user)}
          title="Layer Gets"
          marker="on-device-many-layers"
        />
      )}
    </>
  );
}
