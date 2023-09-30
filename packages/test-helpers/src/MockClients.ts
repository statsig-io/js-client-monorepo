import { jest } from '@jest/globals';

import {
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@sigstat/core';

export abstract class MockRemoteServerEvalClient {
  static create(): jest.Mocked<PrecomputedEvaluationsInterface> {
    return {
      loadingStatus: 'Uninitialized',
      initialize: jest.fn(),
      updateUser: jest.fn(),
      shutdown: jest.fn(),
      checkGate: jest.fn(),
      getFeatureGate: jest.fn(),
      getDynamicConfig: jest.fn(),
      getExperiment: jest.fn(),
      getLayer: jest.fn(),
      logEvent: jest.fn(),
    };
  }
}

export abstract class MockOnDeviceEvalClient {
  static create(): jest.Mocked<OnDeviceEvaluationsInterface> {
    return {
      loadingStatus: 'Uninitialized',
      initialize: jest.fn(),
      shutdown: jest.fn(),
      checkGate: jest.fn(),
      getFeatureGate: jest.fn(),
      getDynamicConfig: jest.fn(),
      getExperiment: jest.fn(),
      getLayer: jest.fn(),
      logEvent: jest.fn(),
    };
  }
}
