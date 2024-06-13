import 'jest-fetch-mock';
import { DcsResponseString, InitResponseString } from 'statsig-test-helpers';

import { Experiment } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

describe('Group Name', () => {
  let experiment: Experiment;

  describe('On Device Eval Client', () => {
    beforeAll(async () => {
      fetchMock.enableMocks();
      fetchMock.mockResponse(DcsResponseString);

      const client = new StatsigOnDeviceEvalClient('client-key');
      await client.initializeAsync();

      experiment = client.getExperiment('an_experiment', { userID: 'a-user' });
    });

    it('returns the correct experiment group', () => {
      expect(experiment.groupName).toBe('Test');
    });
  });

  describe('Precomputed Client', () => {
    beforeAll(async () => {
      fetchMock.enableMocks();
      fetchMock.mockResponse(InitResponseString);

      const client = new StatsigClient('client-key', { userID: 'a-user' });
      await client.initializeAsync();

      experiment = client.getExperiment('an_experiment');
    });

    it('returns the correct experiment group', () => {
      expect(experiment.groupName).toBe('Test');
    });
  });
});
