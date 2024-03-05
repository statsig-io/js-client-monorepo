import fetchMock from 'jest-fetch-mock';

import * as Diagnostics from '../Diagnostics';
import { ErrorBoundary } from '../ErrorBoundary';
import { monitorClass } from '../Monitoring';

class TestClass {
  constructor(eb: ErrorBoundary) {
    monitorClass(eb, TestClass, this);
  }

  instanceMethod() {
    // noop
  }

  static staticMethod() {
    // noop
  }
}

describe('Monitoring', () => {
  let klass: TestClass;
  let ebSpy: jest.SpyInstance;
  let diagSpy: jest.SpyInstance;

  beforeAll(() => {
    fetchMock.enableMocks();

    const eb = new ErrorBoundary('client-key');
    ebSpy = jest.spyOn(eb, 'capture');
    diagSpy = jest.spyOn(Diagnostics, 'captureDiagnostics');

    klass = new TestClass(eb);
  });

  describe.each([
    ['instance', () => klass.instanceMethod()],
    ['static', () => TestClass.staticMethod()],
  ])('Calling the %s method', (_type, action) => {
    beforeAll(() => {
      action();
    });

    it('calls error boundary', () => {
      expect(ebSpy).toHaveBeenCalled();
    });

    it('calls diagnostics', () => {
      expect(diagSpy).toHaveBeenCalled();
    });
  });
});
