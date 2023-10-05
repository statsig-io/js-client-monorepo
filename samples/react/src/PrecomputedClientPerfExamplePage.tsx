import '@react-native-async-storage/async-storage';
import { ReactNode, useEffect, useState } from 'react';

import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const user = { userID: 'a-user' };

const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, user);

function MeasurementDetails({
  title,
  measurement,
}: {
  title: string;
  measurement: PerformanceMeasure;
}) {
  return (
    <div style={{ marginBottom: '50px' }}>
      {title}
      <h2>{measurement.duration.toFixed(4)} ms</h2>
    </div>
  );
}

function ManyChecks({
  marker,
  title,
  action,
}: {
  marker: string;
  title: string;
  action: (i: number) => void;
}) {
  const iterations = 10000;
  const [measurement, setMeasurement] = useState<PerformanceMeasure | null>(
    null,
  );

  useEffect(() => {
    performance.mark(`${marker}-start`);
    for (let i = 0; i < iterations; i++) {
      action(i);
    }
    performance.mark(`${marker}-end`);
    setMeasurement(
      performance.measure(
        `${marker}-duration`,
        `${marker}-start`,
        `${marker}-end`,
      ),
    );
  }, [action, marker, iterations]);

  if (!measurement) {
    return <>...</>;
  }

  return (
    <MeasurementDetails
      title={`${iterations} ${title} Measurement`}
      measurement={measurement}
    />
  );
}

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
        <ManyChecks
          action={(i) => client.checkGate(`gate_num_${i}`)}
          title="Gate Checks"
          marker="precomputed-many-gates"
        />
      )}

      {initMeasurement && (
        <ManyChecks
          action={(i) => client.getDynamicConfig(`dynamic_config_num_${i}`)}
          title="Dynamic Config Gets"
          marker="precomputed-many-dynamic-configs"
        />
      )}

      {initMeasurement && (
        <ManyChecks
          action={(i) => client.getExperiment(`experiment_num_${i}`)}
          title="Experiment Gets"
          marker="precomputed-many-experiments"
        />
      )}

      {initMeasurement && (
        <ManyChecks
          action={(i) => client.getLayer(`layer_num_${i}`)}
          title="Layer Gets"
          marker="precomputed-many-layers"
        />
      )}
    </>
  );
}
