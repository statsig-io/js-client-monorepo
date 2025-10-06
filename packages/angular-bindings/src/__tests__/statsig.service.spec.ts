import { TestBed } from '@angular/core/testing';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  DynamicConfig,
  Experiment,
  Layer,
  ParameterStore,
  PrecomputedEvaluationsInterface,
} from '@statsig/js-client';

import { STATSIG_INIT_CONFIG } from '../statsig.module';
import { StatsigService } from '../statsig.service';

describe('StatsigService', () => {
  let service: StatsigService;
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;
  beforeEach(() => {
    client = jest.mocked(
      MockRemoteServerEvalClient.create() as PrecomputedEvaluationsInterface,
    );
    client.flush.mockReturnValue(Promise.resolve());
    client.shutdown.mockReturnValue(Promise.resolve());
    (client.loadingStatus as unknown) = 'Ready';

    TestBed.configureTestingModule({
      providers: [
        StatsigService,
        {
          provide: STATSIG_INIT_CONFIG,
          useValue: { client: client },
        },
      ],
    });

    service = TestBed.inject(StatsigService);
  });

  it('should call client.checkGate and return its value', () => {
    client.checkGate.mockReturnValue(true);

    const result = service.checkGate('my_gate');
    expect(client.checkGate).toHaveBeenCalledWith('my_gate', undefined);
    expect(result).toBe(true);
  });
  it('should call client.getDynamicConfig and return its value', () => {
    const dynamicConfig = {
      value: { test: 'my_value' },
      name: 'my_config',
      ruleID: 'my_rule_id',
      details: { test: 'my_details' },
      __evaluation: { test: 'my_evaluation' },
      get: () => 'my_value',
    } as unknown as DynamicConfig;
    client.getDynamicConfig.mockReturnValue(dynamicConfig);

    const result = service.getDynamicConfig('my_config');
    expect(client.getDynamicConfig).toHaveBeenCalledWith(
      'my_config',
      undefined,
    );
    expect(result).toEqual(dynamicConfig);
  });

  it('should call client.getExperiment and return its value', () => {
    const experiment = {
      value: { test: 'my_value' },
      name: 'my_experiment',
      ruleID: 'my_rule_id',
      details: { test: 'my_details' },
      __evaluation: { test: 'my_evaluation' },
      get: () => 'my_value',
    } as unknown as Experiment;
    client.getExperiment.mockReturnValue(experiment);

    const result = service.getExperiment('my_experiment');
    expect(client.getExperiment).toHaveBeenCalledWith(
      'my_experiment',
      undefined,
    );
    expect(result).toEqual(experiment);
  });

  it('should call client.getLayer and return its value', () => {
    const layer = {
      value: { test: 'my_value' },
      name: 'my_layer',
      ruleID: 'my_rule_id',
      details: { test: 'my_details' },
      __evaluation: { test: 'my_evaluation' },
      get: () => 'my_value',
    } as unknown as Layer;
    client.getLayer.mockReturnValue(layer);

    const result = service.getLayer('my_layer');
    expect(client.getLayer).toHaveBeenCalledWith('my_layer', undefined);
    expect(result).toEqual(layer);
  });

  it('should call client.getParameterStore and return its value', () => {
    const parameterStore = {
      name: 'my_parameter_store',
      details: { test: 'my_details' },
      __evaluation: { test: 'my_evaluation' },
      get: () => 'my_value',
    } as unknown as ParameterStore;
    client.getParameterStore.mockReturnValue(parameterStore);

    const result = service.getParameterStore('my_parameter_store');
    expect(client.getParameterStore).toHaveBeenCalledWith(
      'my_parameter_store',
      undefined,
    );
    expect(result).toEqual(parameterStore);
    expect(result.get('my_value')).toEqual('my_value');
  });
});
