import fetchMock from 'jest-fetch-mock';
import { anyFunction, anyNumber } from 'statsig-test-helpers';

import { StatsigClientEventData } from '@statsig/client-core';

import StatsigClient from '../StatsigClient';
import InitializeResponse from './initialize.json';

describe('Client Evaluations Callback', () => {
  const user = { userID: 'a-user' };
  let client: StatsigClient;
  let events: StatsigClientEventData[] = [];

  beforeEach(async () => {
    events = [];
    client = new StatsigClient('client-key', user);

    InitializeResponse['time'] = 123456;

    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(InitializeResponse));

    await client.initializeAsync();

    client.on('*', (data) => {
      if (data.event.endsWith('_evaluation')) {
        events.push(data);
      }
    });
  });

  it('fires the gate_evaluation event', () => {
    client.checkGate('a_gate');
    expect(events).toEqual([
      {
        event: 'gate_evaluation',
        gate: {
          name: 'a_gate',
          ruleID: '2QWhVkWdUEXR6Q3KYgV73O',
          details: {
            lcut: 123456,
            reason: 'Network:Recognized',
            receivedAt: anyNumber(),
          },
          value: true,
        },
      },
    ]);
  });

  it('fires the dynamic_config_evaluation event', () => {
    client.getDynamicConfig('a_dynamic_config');
    expect(events).toEqual([
      {
        event: 'dynamic_config_evaluation',
        dynamicConfig: {
          name: 'a_dynamic_config',
          ruleID: 'default',
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
        },
      },
    ]);
  });

  it('fires the experiment_evaluation event', () => {
    client.getExperiment('an_experiment');
    expect(events).toEqual([
      {
        event: 'experiment_evaluation',
        experiment: {
          name: 'an_experiment',
          ruleID: '49CGlTB7z97PEdqJapQplA',
          details: {
            lcut: 123456,
            reason: 'Network:Recognized',
            receivedAt: anyNumber(),
          },
          value: {
            a_string: 'Experiment Test Value',
          },
        },
      },
    ]);
  });

  it('fires the layer_evaluation event', () => {
    client.getLayer('a_layer');
    expect(events).toEqual([
      {
        event: 'layer_evaluation',
        layer: {
          name: 'a_layer',
          ruleID: '49CGlTB7z97PEdqJapQplA',
          details: {
            lcut: 123456,
            reason: 'Network:Recognized',
            receivedAt: anyNumber(),
          },
          getValue: anyFunction(),
        },
      },
    ]);
  });
});
