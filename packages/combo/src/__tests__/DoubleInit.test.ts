import fetchMock from 'jest-fetch-mock';
import { CreateTestPromise, InitResponseString } from 'statsig-test-helpers';

import { Storage } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

const USER = { userID: 'a-user' };

describe('Double Init', () => {
  let startLoggerSpy: jest.SpyInstance;

  beforeAll(() => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);
  });

  describe.each([
    [
      'asynchronous',
      async (client: StatsigClient | StatsigOnDeviceEvalClient) => {
        const promise = CreateTestPromise<void>();
        Storage.isReady = () => false;
        Storage.isReadyResolver = () => promise;
        setTimeout(() => promise.resolve(), 2);

        client.initializeAsync().catch(() => {
          throw 'bad';
        });
        await client.initializeAsync();
      },
    ],
    [
      'synchronous',
      (client: StatsigClient | StatsigOnDeviceEvalClient) => {
        client.initializeSync();
        client.initializeSync();
        return Promise.resolve();
      },
    ],
  ])('', (syncness, setup) => {
    describe.each(['Precomputed', 'OnDevice'])(`${syncness} %s`, (type) => {
      beforeAll(async () => {
        fetchMock.mock.calls = [];

        const sdkKey = 'sdk-key-' + type + syncness;
        const client =
          type === 'Precomputed'
            ? new StatsigClient(sdkKey, USER)
            : new StatsigOnDeviceEvalClient(sdkKey);

        startLoggerSpy = jest.spyOn((client as any)._logger, 'start');

        await setup(client);
      });

      it('only makes one /initialize request', () => {
        expect(fetchMock.mock.calls).toHaveLength(1);
        expect(fetchMock.mock.calls[0][0]).toContain(
          type === 'Precomputed'
            ? '/v1/initialize'
            : '/v1/download_config_specs',
        );
      });

      it('only starts the logger once', () => {
        expect(startLoggerSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
