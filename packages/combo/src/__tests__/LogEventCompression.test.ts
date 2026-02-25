import 'jest-fetch-mock';
import { CompressionStream, DecompressionStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'util';

import {
  Endpoint,
  ErrorBoundary,
  EventLogger,
  LogEventCompressionMode,
  NetworkCore,
  SDKFlags,
  UrlConfiguration,
} from '@statsig/client-core';

Object.assign(global, {
  CompressionStream,
  TextEncoder,
});

const SDK_KEY = 'client-key';
const BODY = {
  sdkKey: SDK_KEY,
  data: {
    values: [1, 2, 3],
  },
  urlConfig: new UrlConfiguration(Endpoint._rgstr, null, null, null),
  isCompressable: true,
};

describe('Log Event Compression', () => {
  const setCompressionFlag = (flag: boolean) => {
    SDKFlags.setFlags(SDK_KEY, {
      enable_log_event_compression: flag,
    });
  };

  let network: NetworkCore;

  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
    fetchMock.mock.calls = [];

    __STATSIG__ = {} as any;

    network = new NetworkCore({});
  });

  it('should compress the body by default even if the flag is false', async () => {
    setCompressionFlag(false);
    BODY.isCompressable = true;

    await network.post(BODY);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toContain('gz=1');
    expect(options?.body?.constructor.name).toBe('Uint8Array');
  });

  it('should compress the body by default when flag is on', async () => {
    setCompressionFlag(true);
    BODY.isCompressable = true;

    await network.post(BODY);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toContain('gz=1');
    expect(options?.body?.constructor.name).toBe('Uint8Array');
  });

  it('should not compress the body if custom url is used and the flag is disabled', async () => {
    setCompressionFlag(false);
    const BODY = {
      sdkKey: SDK_KEY,
      data: {
        values: [1, 2, 3],
      },
      urlConfig: new UrlConfiguration(
        Endpoint._rgstr,
        'proxy-used.com',
        null,
        null,
      ),
      isCompressable: true,
    };

    await network.post(BODY);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).not.toContain('gz=1');
    expect(options?.body?.constructor.name).toBe('String');
  });

  it('should not compress the body if fallback url is used and the flag is disabled', async () => {
    setCompressionFlag(false);
    const BODY = {
      sdkKey: SDK_KEY,
      data: {
        values: [1, 2, 3],
      },
      urlConfig: new UrlConfiguration(Endpoint._rgstr, null, null, [
        'fallback.com',
      ]),
      isCompressable: true,
    };

    await network.post(BODY);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).not.toContain('gz=1');
    expect(options?.body?.constructor.name).toBe('String');
  });

  it('should compress the body if custom url is used and the flag is enabled', async () => {
    setCompressionFlag(true);
    const BODY = {
      sdkKey: SDK_KEY,
      data: {
        values: [1, 2, 3],
      },
      urlConfig: new UrlConfiguration(
        Endpoint._rgstr,
        'proxy-used.com',
        null,
        null,
      ),
      isCompressable: true,
    };

    await network.post(BODY);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toContain('gz=1');
    expect(options?.body?.constructor.name).toBe('Uint8Array');
  });

  it('should compress the body if fallback url is used and the flag is enabled', async () => {
    setCompressionFlag(true);
    const BODY = {
      sdkKey: SDK_KEY,
      data: {
        values: [1, 2, 3],
      },
      urlConfig: new UrlConfiguration(Endpoint._rgstr, null, null, [
        'fallback.com',
      ]),
      isCompressable: true,
    };

    await network.post(BODY);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toContain('gz=1');
    expect(options?.body?.constructor.name).toBe('Uint8Array');
  });

  it('should not compress the body if the body is not compressable', async () => {
    setCompressionFlag(true);
    BODY.isCompressable = false;

    await network.post(BODY);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).not.toContain('gz=1');
    expect(options?.body?.constructor.name).toBe('String');
  });

  it('should not compress the body when no-compress is set', async () => {
    setCompressionFlag(true);
    BODY.isCompressable = true;

    (__STATSIG__ as any)['no-compress'] = 1;

    await network.post(BODY);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).not.toContain('gz=1');
    expect(options?.body?.constructor.name).toBe('String');
  });

  it('can compress very large bodies', async () => {
    setCompressionFlag(true);
    BODY.isCompressable = true;
    const largeData = {
      values: Array.from({ length: 200000 }, (_, i) => i),
    };

    await network.post({ ...BODY, data: largeData });
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toContain('gz=1');
    expect(options?.body?.constructor.name).toBe('Uint8Array');

    const decoded = await decompress(options?.body as any);
    expect(JSON.parse(decoded).values).toEqual(largeData.values);
  });

  type ProxyType = 'api' | 'logEventUrl' | 'none';

  const matrix: Array<{
    name: string;
    proxyType: ProxyType;
    flag: boolean | null;
    mode: LogEventCompressionMode;
    expectCompressed: boolean;
  }> = [
    {
      name: 'proxy=api, flag=false, mode=Enabled => no compression',
      proxyType: 'api',
      flag: false,
      mode: LogEventCompressionMode.Enabled,
      expectCompressed: false,
    },
    {
      name: 'proxy=api, flag=true, mode=Enabled => compression',
      proxyType: 'api',
      flag: true,
      mode: LogEventCompressionMode.Enabled,
      expectCompressed: true,
    },
    {
      name: 'proxy=logEventUrl, flag=false, mode=Enabled => no compression',
      proxyType: 'logEventUrl',
      flag: false,
      mode: LogEventCompressionMode.Enabled,
      expectCompressed: false,
    },
    {
      name: 'proxy=logEventUrl, flag=true, mode=Enabled => compression',
      proxyType: 'logEventUrl',
      flag: true,
      mode: LogEventCompressionMode.Enabled,
      expectCompressed: true,
    },
    {
      name: 'proxy=none, flag=false, mode=Enabled => compression',
      proxyType: 'none',
      flag: false,
      mode: LogEventCompressionMode.Enabled,
      expectCompressed: true,
    },
    {
      name: 'proxy=none, flag=true, mode=Enabled => compression',
      proxyType: 'none',
      flag: true,
      mode: LogEventCompressionMode.Enabled,
      expectCompressed: true,
    },
    {
      name: 'proxy=api, flag=n/a, mode=Forced => compression',
      proxyType: 'api',
      flag: null,
      mode: LogEventCompressionMode.Forced,
      expectCompressed: true,
    },
    {
      name: 'proxy=logEventUrl, flag=n/a, mode=Forced => compression',
      proxyType: 'logEventUrl',
      flag: null,
      mode: LogEventCompressionMode.Forced,
      expectCompressed: true,
    },
    {
      name: 'proxy=none, flag=n/a, mode=Forced => compression',
      proxyType: 'none',
      flag: null,
      mode: LogEventCompressionMode.Forced,
      expectCompressed: true,
    },
    {
      name: 'proxy=api, flag=false, mode=Disabled => no compression',
      proxyType: 'api',
      flag: false,
      mode: LogEventCompressionMode.Disabled,
      expectCompressed: false,
    },
    {
      name: 'proxy=none, flag=true, mode=Disabled => no compression',
      proxyType: 'none',
      flag: true,
      mode: LogEventCompressionMode.Disabled,
      expectCompressed: false,
    },
  ];

  matrix.forEach(({ name, proxyType, flag, mode, expectCompressed }) => {
    it(name, async () => {
      fetchMock.mockClear();
      if (flag !== null) {
        setCompressionFlag(flag);
      }
      const statsigOptions: any = {
        networkConfig: {},
      };

      if (proxyType !== 'none') {
        statsigOptions.networkConfig.api =
          proxyType === 'api'
            ? 'https://proxy.test.com'
            : 'https://events.statsigapi.net/v1/rgstr';
        statsigOptions.networkConfig.logEventUrl =
          proxyType === 'logEventUrl' ? 'https://proxy.test.com' : undefined;
      }
      const network = new NetworkCore({
        networkConfig: statsigOptions.networkConfig,
        logEventCompressionMode: mode,
      });

      const logger = new EventLogger(
        'client-key',
        noopEmitEvent,
        network,
        {
          networkConfig: statsigOptions.networkConfig,
          disableLogging: false,
        },
        new ErrorBoundary('key', {}),
      );

      logger.enqueue({
        eventName: 'test_event',
        user: { userID: 'user', statsigEnvironment: undefined },
        time: Date.now(),
        metadata: {},
        secondaryExposures: [],
      });

      await logger.flush();

      const url = fetchMock.mock.calls[0][0]; // First argument of first fetch call
      const compressed =
        url instanceof Request
          ? url.url.includes('gz=1')
          : url?.includes('gz=1');

      expect(compressed).toBe(expectCompressed);
      expect(fetchMock.mock.calls[0][1]?.body?.constructor.name).toBe(
        expectCompressed ? 'Uint8Array' : 'String',
      );
    });
  });
});

async function decompress(compressed: Uint8Array) {
  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(compressed).catch(() => {
    throw new Error('Failed to write to decompression stream');
  });
  writer.close().catch(() => {
    throw new Error('Failed to close decompression stream');
  });

  const reader = stream.readable.getReader();
  const chunks = [];

  let result;
  while (!(result = await reader.read()).done) {
    chunks.push(...result.value);
  }

  const concatenated = new Uint8Array(chunks);
  return new TextDecoder().decode(concatenated);
}

function noopEmitEvent(): void {
  // intentionally empty
}
