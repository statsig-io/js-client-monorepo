import { ReactNode } from 'react';

export default function MeasurementDetails({
  title,
  measurement,
  addition,
}: {
  title: string;
  measurement: PerformanceMeasure;
  addition?: string;
}): ReactNode {
  return (
    <div style={{ marginBottom: '50px' }}>
      {title}
      <h2>
        {measurement.duration.toFixed(4)} ms{' '}
        <small
          style={{
            fontSize: '16px',
            marginLeft: '4px',
          }}
        >
          {addition}
        </small>
      </h2>
    </div>
  );
}
