import fetchMock from 'jest-fetch-mock';
import {
  CreateTestPromise,
  InitResponseString,
  anyObject,
  anyStringContaining,
} from 'statsig-test-helpers';

import { Storage } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

/* eslint-disable @typescript-eslint/no-floating-promises */

function expectOneNetworkRequest(endpoint: string) {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(
    anyStringContaining(endpoint),
    anyObject(),
  );
}

function setDelayedStorageProvider() {
  const promise = CreateTestPromise<void>();
  Storage.isReady = () => false;
  Storage.isReadyResolver = () => promise;
  setTimeout(() => promise.resolve(), 2);
}

describe('Double Init', () => {
  const logger = {
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    enqueue: jest.fn(),
  };

  const clearMocks = () => {
    logger.start.mockClear();
    fetchMock.mockClear();
  };

  beforeAll(() => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);
  });

  describe('StatsigClient', () => {
    let client: StatsigClient;

    beforeAll(() => {
      client = new StatsigClient('client-key', {});
      (client as any)._logger = logger;
    });

    describe('synchronous', () => {
      beforeAll(() => {
        clearMocks();

        client.initializeSync(); // once
        client.initializeSync(); // twice
      });

      it('calls logger start once', () => {
        expect(logger.start).toHaveBeenCalledTimes(1);
      });

      it('only makes one /initialize request', () => {
        expectOneNetworkRequest('/v1/initialize');
      });

      describe('re-init', () => {
        beforeAll(() => {
          clearMocks();

          client.shutdown();
          client.initializeSync();
        });

        it('re-calls logger start once', () => {
          expect(logger.start).toHaveBeenCalledTimes(1);
        });

        it('requests /initialize again', () => {
          expectOneNetworkRequest('/v1/initialize');
        });
      });
    });

    describe('asynchronous', () => {
      beforeAll(async () => {
        clearMocks();
        setDelayedStorageProvider();

        await Promise.all([client.initializeAsync(), client.initializeAsync()]);
      });

      it('calls logger start once', () => {
        expect(logger.start).toHaveBeenCalledTimes(1);
      });

      it('only makes one /initialize request', () => {
        expectOneNetworkRequest('/v1/initialize');
      });

      describe('re-init', () => {
        beforeAll(async () => {
          clearMocks();

          client.shutdown();
          await client.initializeAsync();
        });

        it('re-calls logger start once', () => {
          expect(logger.start).toHaveBeenCalledTimes(1);
        });

        it('requests /initialize again', () => {
          expectOneNetworkRequest('/v1/initialize');
        });
      });
    });
  });

  describe('StatsigOnDeviceEvalClient', () => {
    let client: StatsigOnDeviceEvalClient;

    beforeAll(() => {
      client = new StatsigOnDeviceEvalClient('client-key');
      (client as any)._logger = logger;
    });

    describe('synchronous', () => {
      beforeAll(() => {
        clearMocks();

        client.initializeSync(); // once
        client.initializeSync(); // twice
      });

      it('calls logger start once', () => {
        expect(logger.start).toHaveBeenCalledTimes(1);
      });

      it('only makes one /download_config_specs request', () => {
        expectOneNetworkRequest('/v1/download_config_specs');
      });

      describe('re-init', () => {
        beforeAll(() => {
          clearMocks();

          client.shutdown();
          client.initializeSync();
        });

        it('re-calls logger start once', () => {
          expect(logger.start).toHaveBeenCalledTimes(1);
        });

        it('requests /download_config_specs again', () => {
          expectOneNetworkRequest('/v1/download_config_specs');
        });
      });
    });

    describe('asynchronous', () => {
      beforeAll(async () => {
        clearMocks();
        setDelayedStorageProvider();

        await Promise.all([client.initializeAsync(), client.initializeAsync()]);
      });

      it('calls logger start once', () => {
        expect(logger.start).toHaveBeenCalledTimes(1);
      });

      it('only makes one /download_config_specs request', () => {
        expectOneNetworkRequest('/v1/download_config_specs');
      });

      describe('re-init', () => {
        beforeAll(async () => {
          clearMocks();

          client.shutdown();
          await client.initializeAsync();
        });

        it('re-calls logger start once', () => {
          expect(logger.start).toHaveBeenCalledTimes(1);
        });

        it('requests /download_config_specs again', () => {
          expectOneNetworkRequest('/v1/download_config_specs');
        });
      });
    });
  });
});
