import 'jest-fetch-mock';
import { noop, nullthrows } from 'statsig-test-helpers';
import { URLSearchParams } from 'url';

import { StatsigGlobal } from '../$_StatsigGlobal';
import { NetworkCore } from '../NetworkCore';

describe('Statsig Encoding', () => {
  const url = 'http://statsig.io/foo';
  const sdkKey = 'client-foo';
  let network: NetworkCore;

  beforeAll(() => {
    fetchMock.enableMocks();
    network = new NetworkCore({});
  });

  describe('encoded requests', () => {
    beforeAll(async () => {
      fetchMock.mockClear();

      await network.post({
        url,
        data: { key: 'value' },
        sdkKey,
        isStatsigEncodable: true,
      });
    });

    it('includes the "se" param', async () => {
      const [u] = fetchMock.mock.calls[0];
      const params = new URLSearchParams(String(u));

      expect(params.get('se')).toBe('1');
    });

    it('encodes the body', () => {
      const [, r] = fetchMock.mock.calls[0];
      const actual = atob(String(r?.body).split('').reverse().join(''));
      expect(actual).toContain('"key":"value"');
    });
  });

  describe.each([
    ['isStatsigEncodable is false', noop, { isStatsigEncodable: false }],
    [
      'StatsigOptions.disableStatsigEncoding is true',
      () => {
        network = new NetworkCore({ disableStatsigEncoding: true });
      },
      { isStatsigEncodable: true },
    ],
    [
      "__STATSIG__['no-encode'] is set",
      () => {
        nullthrows(__STATSIG__)['no-encode'] = 'any-truthy-value';
      },
      { isStatsigEncodable: true },
    ],
  ])('%s', (_title, setup, args) => {
    beforeAll(async () => {
      __STATSIG__ = {} as StatsigGlobal;
      fetchMock.mockClear();

      setup();

      await network.post({
        url,
        data: { key: 'value' },
        sdkKey,
        ...args,
      });
    });

    it('does not include the "se" param', async () => {
      const [u] = fetchMock.mock.calls[0];
      const params = new URLSearchParams(String(u));

      expect(params.get('se')).toBeNull();
    });

    it('does not encode the body', () => {
      const [, r] = fetchMock.mock.calls[0];
      expect(String(r?.body)).toContain('"key":"value"');
    });
  });

  describe('window.btoa failures', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
    });

    describe('when btoa throws', () => {
      beforeAll(async () => {
        window.btoa = () => {
          throw '';
        };

        await network.post({
          url,
          data: { key: 'value' },
          sdkKey,
          isStatsigEncodable: true,
        });
      });

      it('does not set the "se" header', async () => {
        const [u] = fetchMock.mock.calls[0];
        const params = new URLSearchParams(String(u));

        expect(params.get('se')).toBeNull();
      });

      it('does not encode the body', async () => {
        const actual = String(fetchMock.mock.calls[0]?.[1]?.body ?? '');
        expect(actual).toContain('"key":"value"');
      });
    });

    describe('when btoa is undefined', () => {
      beforeAll(async () => {
        (window as any).btoa = undefined;

        await network.post({
          url,
          data: { key: 'value' },
          sdkKey,
          isStatsigEncodable: true,
        });
      });

      it('does not set the "se" header', async () => {
        const [u] = fetchMock.mock.calls[0];
        const params = new URLSearchParams(String(u));

        expect(params.get('se')).toBeNull();
      });

      it('does not encode the body', async () => {
        const actual = String(fetchMock.mock.calls[0]?.[1]?.body ?? '');
        expect(actual).toContain('"key":"value"');
      });
    });
  });
});
