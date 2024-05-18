/**
 * @jest-environment node
 */

/* eslint-disable no-await-in-loop */
import 'jest-fetch-mock';
import { InitResponseString, MockLocalStorage } from 'statsig-test-helpers';
import { setFlagsFromString } from 'v8';
import { runInNewContext } from 'vm';

import { LogLevel } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

setFlagsFromString('--expose_gc');
const gc = runInNewContext('gc');

describe('Memory Usage', () => {
  beforeAll(() => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);

    MockLocalStorage.enabledMockStorage();
  });

  it('clears all used memory when done', async () => {
    for (let i = 0; i < 1000; i++) {
      const instance = new StatsigClient(
        'client-key',
        {},
        { logLevel: LogLevel.None },
      );
      await instance.initializeAsync();
    }
    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < 10000; i++) {
      __STATSIG__ = {} as any;
      const instance = new StatsigClient(
        'client-key',
        {},
        { logLevel: LogLevel.None },
      );
      await instance.initializeAsync();
    }

    gc();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(1);
  });
});
