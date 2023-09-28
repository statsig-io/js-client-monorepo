import {
  OnDeviceEvalutationsInterface,
  PrecomputedEvalutationsInterface,
} from '@sigstat/core';

import { jest } from '@jest/globals';

export abstract class MockRemoteServerEvalClient {
  static create(): jest.Mocked<PrecomputedEvalutationsInterface> {
    return {
      loadingStatus: 'Uninitialized',
      initialize: jest.fn(),
      updateUser: jest.fn(),
      shutdown: jest.fn(),
      checkGate: jest.fn(),
      getDynamicConfig: jest.fn(),
      getExperiment: jest.fn(),
      getLayer: jest.fn(),
      logEvent: jest.fn(),
    };
  }
}

export abstract class MockOnDeviceEvalClient {
  static create(): jest.Mocked<OnDeviceEvalutationsInterface> {
    return {
      loadingStatus: 'Uninitialized',
      initialize: jest.fn(),
      shutdown: jest.fn(),
      checkGate: jest.fn(),
      getDynamicConfig: jest.fn(),
      getExperiment: jest.fn(),
      getLayer: jest.fn(),
      logEvent: jest.fn(),
    };
  }
}
