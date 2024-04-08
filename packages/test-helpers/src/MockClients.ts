import { jest } from '@jest/globals';

import {
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@statsig/client-core';

function getBaseMock<T>(): T {
  return {
    loadingStatus: 'Uninitialized',
    initializeSync: jest.fn(),
    initializeAsync: jest.fn(),
    shutdown: jest.fn(),
    flush: jest.fn(),
    checkGate: jest.fn(),
    getContext: jest.fn(),
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
  static create(): jest.MockedObject<PrecomputedEvaluationsInterface> &
    PrecomputedEvaluationsInterface {
    return {
      ...getBaseMock(),
      updateUserSync: jest.fn(),
      updateUserAsync: jest.fn(),
    };
  }
}

export abstract class MockOnDeviceEvalClient {
  static create(): jest.Mocked<OnDeviceEvaluationsInterface> &
    OnDeviceEvaluationsInterface {
    return {
      ...getBaseMock(),
    };
  }
}
