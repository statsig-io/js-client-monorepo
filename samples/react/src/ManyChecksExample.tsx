import { ReactNode, useEffect, useState } from 'react';

import MeasurementDetails from './MeasurementDetails';

export default function ManyChecksExample({
  marker,
  title,
  action,
}: {
  marker: string;
  title: string;
  action: (i: number) => void;
}): ReactNode {
  const iterations = 1000;
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
      addition={`(~${(measurement.duration / iterations).toFixed(3)} each)`}
    />
  );
}
