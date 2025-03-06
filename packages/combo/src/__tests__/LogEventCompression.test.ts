import 'jest-fetch-mock';
import { CompressionStream, DecompressionStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'util';

import {
  Endpoint,
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

// describe('Log Event Compression', () => {
describe('this_test', () => {
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
