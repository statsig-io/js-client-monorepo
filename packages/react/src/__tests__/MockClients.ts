import { IStatsigRemoteEvalClient } from '@statsig-client/core';

export function newMockRemoteClient(): jest.Mocked<IStatsigRemoteEvalClient> {
  return {
    loadingStatus: 'uninitialized',
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

export function createDeferredPromise<T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
}
