import fetchMock from 'jest-fetch-mock';

import * as Diagnostics from '../Diagnostics';
import { ErrorBoundary } from '../ErrorBoundary';
import { monitorClass } from '../Monitoring';

class TestClassBase {
  parentMethod() {
    // noop
  }
}

class TestClass extends TestClassBase {
  constructor(eb: ErrorBoundary) {
    super();
    monitorClass(eb, this);
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
    ['parent', () => klass.parentMethod()],
    ['instance', () => klass.instanceMethod()],
    ['static', () => TestClass.staticMethod()],
  ])('Calling the %s method', (_type, action) => {
    beforeEach(() => {
      ebSpy.mock.calls = [];
      diagSpy.mock.calls = [];

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
