import {
  IStatsigOnDeviceEvalClient,
  IStatsigRemoteServerEvalClient,
} from '@dloomb-client/core';

export abstract class MockRemoteServerEvalClient {
  static create(): jest.Mocked<IStatsigRemoteServerEvalClient> {
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
  static create(): jest.Mocked<IStatsigOnDeviceEvalClient> {
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
