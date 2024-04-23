import fetchMock from 'jest-fetch-mock';
import {
  DcsResponse,
  InitResponse,
  anyFunction,
  anyNumber,
  anyObject,
} from 'statsig-test-helpers';

import {
  AnyStatsigClientEvent,
  StatsigClientInterface,
  StatsigGlobal,
} from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

describe('Client Evaluations Callback', () => {
  const user = { userID: 'a-user' };

  describe.each([
    [
      'StatsigOnDeviceEvalClient',
      () => {
        fetchMock.mockResponse(
          JSON.stringify({ ...DcsResponse, time: 123456 }),
        );
        return new StatsigOnDeviceEvalClient('client-on-device');
      },
    ],
    [
      'StatsigClient',
      () => {
        fetchMock.mockResponse(
          JSON.stringify({ ...InitResponse, time: 123456 }),
        );
        return new StatsigClient('client-precomp', user);
      },
    ],
  ])('%s', (_title, factory) => {
    let client: StatsigClientInterface;
    let events: AnyStatsigClientEvent[] = [];

    beforeEach(async () => {
      __STATSIG__ = {} as StatsigGlobal;
      fetchMock.enableMocks();

      events = [];
      client = factory();

      await client.initializeAsync();

      client.on('*', (event) => {
        if (event.name.endsWith('_evaluation')) {
          events.push(event);
        }
      });
    });

    it('fires the gate_evaluation event', () => {
      client.checkGate('a_gate', user);
      expect(events).toEqual([
        {
          name: 'gate_evaluation',
          gate: {
            name: 'a_gate',
            ruleID: '2QWhVkWdUEXR6Q3KYgV73O',
            details: {
              lcut: 123456,
              reason: 'Network:Recognized',
              receivedAt: anyNumber(),
            },
            value: true,
            __evaluation: anyObject(),
          },
        },
      ]);
    });

    it('fires the dynamic_config_evaluation event', () => {
      client.getDynamicConfig('a_dynamic_config', user);
      expect(events).toEqual([
        {
          name: 'dynamic_config_evaluation',
          dynamicConfig: {
            name: 'a_dynamic_config',
            ruleID: 'default',
            groupName: null,
            details: {
              lcut: 123456,
              reason: 'Network:Recognized',
              receivedAt: anyNumber(),
            },
            value: {
              blue: '#00FF00',
              green: '#0000FF',
              red: '#FF0000',
            },
            get: anyFunction(),
            __evaluation: anyObject(),
          },
        },
      ]);
    });

    it('fires the experiment_evaluation event', () => {
      client.getExperiment('an_experiment', user);
      expect(events).toEqual([
        {
          name: 'experiment_evaluation',
          experiment: {
            name: 'an_experiment',
            ruleID: '49CGlTB7z97PEdqJapQplA',
            groupName: null,
            details: {
              lcut: 123456,
              reason: 'Network:Recognized',
              receivedAt: anyNumber(),
            },
            value: {
              a_string: 'Experiment Test Value',
            },
            get: anyFunction(),
            __evaluation: anyObject(),
          },
        },
      ]);
    });

    it('fires the layer_evaluation event', () => {
      client.getLayer('a_layer', user);
      expect(events).toEqual([
        {
          name: 'layer_evaluation',
          layer: {
            name: 'a_layer',
            ruleID: '49CGlTB7z97PEdqJapQplA',
            groupName: 'Test',
            details: {
              lcut: 123456,
              reason: 'Network:Recognized',
              receivedAt: anyNumber(),
            },
            get: anyFunction(),
            __value: anyObject(),
            __evaluation: anyObject(),
          },
        },
      ]);
    });
  });
});
