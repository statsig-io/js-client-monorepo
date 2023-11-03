import * as Diagnostics from '../Diagnostics';
import * as ErrorBoundary from '../ErrorBoundary';
import { MonitoredClass } from '../Monitoring';

@MonitoredClass
class TestClass {
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
    ebSpy = jest.spyOn(ErrorBoundary, 'errorBoundary');
    diagSpy = jest.spyOn(Diagnostics, 'captureDiagnostics');

    klass = new TestClass();
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
