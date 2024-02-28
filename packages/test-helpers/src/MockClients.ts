import { jest } from '@jest/globals';

import {
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@statsig/client-core';

function getBaseMock<T>(): T {
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
    on: jest.fn(),
    off: jest.fn(),
  } as T;
}

export abstract class MockRemoteServerEvalClient {
  static create(): jest.Mocked<PrecomputedEvaluationsInterface> {
    return {
      ...getBaseMock(),
      updateUser: jest.fn(),
    };
  }
}

export abstract class MockOnDeviceEvalClient {
  static create(): jest.Mocked<OnDeviceEvaluationsInterface> {
    return {
      ...getBaseMock(),
    };
  }
}
