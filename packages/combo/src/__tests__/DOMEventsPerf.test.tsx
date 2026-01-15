import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import React from 'react';

import { StatsigClient, _getStatsigGlobal } from '@statsig/js-client';
import { StatsigProvider } from '@statsig/react-bindings';
import { runStatsigSessionReplay } from '@statsig/session-replay';
import { runStatsigAutoCapture } from '@statsig/web-analytics';

const SDK_KEY = process.env.STATSIG_CLIENT_SDK_KEY ?? '';
const STRESS_ITERATIONS = 200;
const BATCH_COUNT = 5;

type CpuMeasurement = { user: number; system: number };

interface PerfMetrics {
  latency: {
    avg: number;
    min: number;
    max: number;
    perUnit: number;
  };
  cpu: {
    user: number;
    system: number;
    total: number;
    perUnit: number;
    utilization: number;
  };
}

function computeMetrics(
  latencyMeasurements: number[],
  cpuMeasurements: CpuMeasurement[],
  unitsPerBatch: number,
): PerfMetrics {
  const avgLatency =
    latencyMeasurements.reduce((a, b) => a + b, 0) / latencyMeasurements.length;
  const avgUserCpu =
    cpuMeasurements.reduce((a, b) => a + b.user, 0) / cpuMeasurements.length;
  const avgSystemCpu =
    cpuMeasurements.reduce((a, b) => a + b.system, 0) / cpuMeasurements.length;
  const avgTotalCpu = avgUserCpu + avgSystemCpu;

  return {
    latency: {
      avg: avgLatency,
      min: Math.min(...latencyMeasurements),
      max: Math.max(...latencyMeasurements),
      perUnit: avgLatency / unitsPerBatch,
    },
    cpu: {
      user: avgUserCpu,
      system: avgSystemCpu,
      total: avgTotalCpu,
      perUnit: avgTotalCpu / unitsPerBatch,
      utilization: (avgTotalCpu / avgLatency) * 100,
    },
  };
}

function printMetrics(
  label: string,
  unitsPerBatch: number,
  metrics: PerfMetrics,
): void {
  // eslint-disable-next-line no-console
  console.log(
    [
      `[Perf] ${label} (${unitsPerBatch} per batch):`,
      `  Latency: avg=${metrics.latency.avg.toFixed(2)}ms, min=${metrics.latency.min.toFixed(2)}ms, max=${metrics.latency.max.toFixed(2)}ms, per_unit=${metrics.latency.perUnit.toFixed(3)}ms`,
      `  CPU: total=${metrics.cpu.total.toFixed(2)}ms, user=${metrics.cpu.user.toFixed(2)}ms, sys=${metrics.cpu.system.toFixed(2)}ms, per_unit=${metrics.cpu.perUnit.toFixed(3)}ms, util=${metrics.cpu.utilization.toFixed(1)}%`,
    ].join('\n'),
  );
}

function logPerfEvents(
  client: StatsigClient,
  eventPrefix: string,
  unitsPerBatch: number,
  metrics: PerfMetrics,
): void {
  client.logEvent(`${eventPrefix}_latency`, metrics.latency.avg, {
    batches: BATCH_COUNT.toString(),
    units_per_batch: unitsPerBatch.toString(),
    min_batch_ms: metrics.latency.min.toFixed(2),
    max_batch_ms: metrics.latency.max.toFixed(2),
    per_unit_ms: metrics.latency.perUnit.toFixed(3),
  });

  client.logEvent(`${eventPrefix}_cpu`, metrics.cpu.total, {
    batches: BATCH_COUNT.toString(),
    units_per_batch: unitsPerBatch.toString(),
    user_cpu_ms: metrics.cpu.user.toFixed(2),
    system_cpu_ms: metrics.cpu.system.toFixed(2),
    per_unit_cpu_ms: metrics.cpu.perUnit.toFixed(3),
    cpu_utilization_pct: metrics.cpu.utilization.toFixed(1),
  });
}

function StressTestContent() {
  const [state, setState] = React.useState({
    clicks: 0,
    mouseMoves: 0,
    keyPresses: 0,
    scrolls: 0,
    inputValue: '',
  });

  return (
    <div
      data-testid="stress-container"
      style={{ width: '100%', height: '100vh' }}
      onMouseMove={() =>
        setState((s) => ({ ...s, mouseMoves: s.mouseMoves + 1 }))
      }
    >
      <div data-testid="stats">
        Clicks: {state.clicks} | Mouse: {state.mouseMoves} | Keys:{' '}
        {state.keyPresses}
      </div>
      <button
        data-testid="stress-button"
        onClick={() => setState((s) => ({ ...s, clicks: s.clicks + 1 }))}
      >
        Click Me
      </button>
      <input
        data-testid="stress-input"
        value={state.inputValue}
        onChange={(e) =>
          setState((s) => ({ ...s, inputValue: e.target.value }))
        }
        onKeyDown={() =>
          setState((s) => ({ ...s, keyPresses: s.keyPresses + 1 }))
        }
      />
      <div
        data-testid="scroll-area"
        style={{ height: 300, overflow: 'auto' }}
        onScroll={() => setState((s) => ({ ...s, scrolls: s.scrolls + 1 }))}
      >
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="scroll-item"
            style={{ padding: 10, borderBottom: '1px solid #ccc' }}
          >
            Scroll Item {i}
          </div>
        ))}
      </div>
      <textarea
        data-testid="stress-textarea"
        rows={5}
        placeholder="Type a lot here..."
      />
    </div>
  );
}

describe('DOM Events Performance with Session Replay and AutoCapture', () => {
  let client: StatsigClient;

  beforeAll(() => {
    if (SDK_KEY) {
      // Disable fetch mocks to log performance metrics to statsig
      fetchMock.disableMocks();
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        'STATSIG_CLIENT_SDK_KEY not set. Skipping real SDK initialization.',
      );
    }

    Object.defineProperty(window, 'innerWidth', {
      value: 1920,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 1080,
      writable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/stress-test', protocol: 'https:' },
      writable: true,
    });
  });

  beforeEach(async () => {
    __STATSIG__ = {} as any;
    _getStatsigGlobal().acInstances = {};

    client = new StatsigClient(
      SDK_KEY || 'client-test-key',
      { userID: 'perf-test-user' },
      { loggingIntervalMs: 50 },
    );

    if (SDK_KEY) {
      await client.initializeAsync();
    }
  });

  afterEach(async () => {
    await act(async () => {
      if (client) {
        await client.shutdown();
      }
    });
  });

  it('should handle rapid click events efficiently', async () => {
    runStatsigSessionReplay(client);
    runStatsigAutoCapture(client);

    render(
      <StatsigProvider client={client}>
        <StressTestContent />
      </StatsigProvider>,
    );

    const button = screen.getByTestId('stress-button');

    const latencyMeasurements: number[] = [];
    const cpuMeasurements: CpuMeasurement[] = [];

    for (let batch = 0; batch < BATCH_COUNT; batch++) {
      const batchStart = performance.now();
      const cpuStart = process.cpuUsage();

      for (let i = 0; i < STRESS_ITERATIONS; i++) {
        fireEvent.click(button);
      }

      const cpuEnd = process.cpuUsage(cpuStart);
      latencyMeasurements.push(performance.now() - batchStart);
      cpuMeasurements.push({
        user: cpuEnd.user / 1000,
        system: cpuEnd.system / 1000,
      });
      await new Promise((r) => setTimeout(r, 10));
    }

    const metrics = computeMetrics(
      latencyMeasurements,
      cpuMeasurements,
      STRESS_ITERATIONS,
    );
    printMetrics('Click Events', STRESS_ITERATIONS, metrics);

    if (SDK_KEY) {
      logPerfEvents(
        client,
        'js_mono_perf_click_events',
        STRESS_ITERATIONS,
        metrics,
      );
      await client.flush();
    }

    expect(metrics.latency.perUnit).toBeLessThan(6);
  });

  it('should handle mixed event types efficiently', async () => {
    runStatsigSessionReplay(client);
    runStatsigAutoCapture(client);

    render(
      <StatsigProvider client={client}>
        <StressTestContent />
      </StatsigProvider>,
    );

    const button = screen.getByTestId('stress-button');
    const input = screen.getByTestId('stress-input');
    const container = screen.getByTestId('stress-container');
    const scrollArea = screen.getByTestId('scroll-area');

    const latencyMeasurements: number[] = [];
    const cpuMeasurements: CpuMeasurement[] = [];
    const eventsPerIteration = 5; // click, mouseMove, change, scroll, keyDown
    const totalEventsPerBatch = STRESS_ITERATIONS * eventsPerIteration;

    for (let batch = 0; batch < BATCH_COUNT; batch++) {
      const batchStart = performance.now();
      const cpuStart = process.cpuUsage();

      for (let i = 0; i < STRESS_ITERATIONS; i++) {
        await act(async () => {
          fireEvent.click(button);
          fireEvent.mouseMove(container, { clientX: i * 2, clientY: i });
          fireEvent.change(input, { target: { value: `val-${i}` } });
          fireEvent.scroll(scrollArea, { target: { scrollTop: i * 10 } });
          fireEvent.keyDown(input, { key: String.fromCharCode(65 + (i % 26)) });
        });
      }

      const cpuEnd = process.cpuUsage(cpuStart);
      latencyMeasurements.push(performance.now() - batchStart);
      cpuMeasurements.push({
        user: cpuEnd.user / 1000,
        system: cpuEnd.system / 1000,
      });
      await new Promise((r) => setTimeout(r, 10));
    }

    const metrics = computeMetrics(
      latencyMeasurements,
      cpuMeasurements,
      totalEventsPerBatch,
    );
    printMetrics('Mixed Events', totalEventsPerBatch, metrics);

    if (SDK_KEY) {
      logPerfEvents(
        client,
        'js_mono_perf_mixed_events',
        totalEventsPerBatch,
        metrics,
      );
      await client.flush();
    }

    expect(metrics.latency.perUnit).toBeLessThan(2);
  });

  it('should measure heavy event logging performance', async () => {
    runStatsigSessionReplay(client);
    runStatsigAutoCapture(client);

    render(
      <StatsigProvider client={client}>
        <StressTestContent />
      </StatsigProvider>,
    );

    const latencyMeasurements: number[] = [];
    const cpuMeasurements: CpuMeasurement[] = [];
    const eventsPerIteration = 2; // click + change
    const totalEventsPerBatch = STRESS_ITERATIONS * eventsPerIteration;

    for (let batch = 0; batch < BATCH_COUNT; batch++) {
      const batchStart = performance.now();
      const cpuStart = process.cpuUsage();

      for (let i = 0; i < STRESS_ITERATIONS; i++) {
        client.logEvent('heavy_event_logging', i);
      }

      const cpuEnd = process.cpuUsage(cpuStart);
      latencyMeasurements.push(performance.now() - batchStart);
      cpuMeasurements.push({
        user: cpuEnd.user / 1000,
        system: cpuEnd.system / 1000,
      });
      await new Promise((r) => setTimeout(r, 10));
    }

    const metrics = computeMetrics(
      latencyMeasurements,
      cpuMeasurements,
      totalEventsPerBatch,
    );
    printMetrics('Heavy Event Logging', totalEventsPerBatch, metrics);

    if (SDK_KEY) {
      logPerfEvents(
        client,
        'js_mono_perf_heavy_logging',
        totalEventsPerBatch,
        metrics,
      );
      await client.flush();
    }

    expect(metrics.latency.perUnit).toBeLessThan(1);
  });
});
