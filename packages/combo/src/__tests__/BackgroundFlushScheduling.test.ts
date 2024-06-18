import 'jest-fetch-mock';

import { StatsigClient } from '@statsig/js-client';

Object.defineProperty(global, 'performance', { writable: true });

const win = global.window;
const doc = global.document;
const proc = process;

describe('Background Flush Scheduling', () => {
  const setup = async () => {
    jest.useFakeTimers();

    fetchMock.enableMocks();
    fetchMock.mock.calls = [];

    const client = new StatsigClient(
      'client-key',
      {},
      { loggingIntervalMs: 1, loggingBufferMaxSize: 999 },
    );
    client.initializeSync();

    for (let i = 0; i <= 10; i++) {
      setTimeout(() => client.logEvent('my_event'), i);

      // eslint-disable-next-line no-await-in-loop
      await jest.advanceTimersByTimeAsync(10);
    }
  };

  const getLogCalls = () =>
    fetchMock.mock.calls.filter((call) => String(call[0]).includes('rgstr'));

  it("does not schedule in 'node' environments", async () => {
    setEnvironment('node');
    await setup();
    expect(getLogCalls()).toHaveLength(0);
  });

  it("does not schedule in 'edge' environments", async () => {
    setEnvironment('edge');
    await setup();
    expect(getLogCalls()).toHaveLength(0);
  });

  it("does schedule in 'browser' environments", async () => {
    setEnvironment('browser');
    await setup();
    expect(getLogCalls()).toHaveLength(10);
  });

  it("does schedule in 'mobile' environments", async () => {
    setEnvironment('mobile');
    await setup();
    expect(getLogCalls()).toHaveLength(10);
  });
});

function setEnvironment(type: 'node' | 'edge' | 'mobile' | 'browser') {
  delete (global as any).window;
  delete (global as any).document;
  delete (global as any).EdgeRuntime;
  delete (global as any).process;

  switch (type) {
    case 'node':
      (global as any).process = proc;
      break;

    case 'edge':
      (global as any).EdgeRuntime = 'livin-on-the-edge';
      break;

    case 'mobile':
      (global as any).window = win;
      break;

    case 'browser':
      (global as any).window = win;
      (global as any).document = doc;
      break;
  }
}
