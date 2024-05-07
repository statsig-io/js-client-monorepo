import fetchMock from 'jest-fetch-mock';
import { anyObject, anyStringContaining } from 'statsig-test-helpers';

import { StatsigClient } from '@statsig/js-client';

describe('Event Emitter Error Logs', () => {
  let client: StatsigClient;
  let logSpy: jest.SpyInstance;

  const Err = (name: string) => {
    const err = new Error(name);
    err.name = name;
    return err;
  };

  beforeAll(() => {
    fetchMock.enableMocks();

    client = new StatsigClient('client-key', { userID: '' });

    logSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // noop
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {
      // noop
    });

    client.on('gate_evaluation', () => {
      throw Err('UserError');
    });

    client.$on('experiment_evaluation', () => {
      throw Err('InternalError');
    });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('user errors', () => {
    beforeAll(() => {
      client.checkGate('a_gate');
    });

    it('logs to console', () => {
      expect(logSpy).toHaveBeenCalledWith(
        '[Statsig]',
        'An error occurred in a StatsigClientEvent listener. This is not an issue with Statsig.',
        anyObject(),
      );
    });

    it('logs nothing to error boundary', () => {
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('internal errors', () => {
    beforeAll(() => {
      client.getExperiment('an_experiment');
    });

    it('logs nothing to console', () => {
      expect(logSpy).toHaveBeenCalledWith(
        '[Statsig]',
        'An error occurred in a StatsigClientEvent listener. This is not an issue with Statsig.',
        anyObject(),
      );
    });

    it('logs to error boundary', () => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('https://statsigapi.net/v1/sdk_exception'),
        anyObject(),
      );

      const body = JSON.parse(
        fetchMock.mock.calls[0]?.[1]?.body?.toString() ?? '{}',
      );
      expect(body).toMatchObject({
        exception: 'InternalError',
      });
    });
  });
});
