/* eslint-disable no-console */
import { AutoCaptureEventName } from '../AutoCaptureEvent';
import { ConsoleLogManager } from '../ConsoleLogManager';

describe('ConsoleLogManager', () => {
  let consoleLogManager: ConsoleLogManager;
  let mockEnqueueFn: jest.Mock;
  let originalConsole: Console;

  beforeEach(() => {
    mockEnqueueFn = jest.fn();
    consoleLogManager = new ConsoleLogManager(mockEnqueueFn, { enabled: true });
    originalConsole = { ...console };
  });

  afterEach(() => {
    consoleLogManager.stopTracking();
    // Restore original console methods
    Object.keys(originalConsole).forEach((key) => {
      if (typeof originalConsole[key as keyof Console] === 'function') {
        (console as any)[key] = originalConsole[key as keyof Console];
      }
    });
  });

  describe('startTracking and stopTracking', () => {
    it('should start tracking console logs', () => {
      consoleLogManager.startTracking();
      expect(consoleLogManager['_isTracking']).toBe(true);
    });

    it('should not start tracking if already tracking', () => {
      consoleLogManager.startTracking();
      const restoreFnsLength = consoleLogManager['_restoreFns'].length;
      consoleLogManager.startTracking();
      expect(consoleLogManager['_restoreFns'].length).toBe(restoreFnsLength);
    });

    it('should not start tracking if disabled', () => {
      const consoleLogManagerDisabled = new ConsoleLogManager(mockEnqueueFn, {
        enabled: false,
      });
      consoleLogManagerDisabled.startTracking();
      expect(consoleLogManagerDisabled['_isTracking']).toBe(false);
    });
  });

  describe('console log interception', () => {
    beforeEach(() => {
      consoleLogManager.startTracking();
    });

    it('should intercept console.log calls', () => {
      console.log('test message');

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        'test message',
        expect.objectContaining({
          status: 'info',
          log_level: 'log',
          payload: ['test message'],
          timestamp: expect.any(Number),
        }),
      );
    });

    it('should intercept console.info calls', () => {
      console.info('info message');

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        'info message',
        expect.objectContaining({
          status: 'info',
          log_level: 'info',
          payload: ['info message'],
        }),
      );
    });

    it('should intercept console.warn calls', () => {
      console.warn('warning message');

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        'warning message',
        expect.objectContaining({
          status: 'warn',
          log_level: 'warn',
          payload: ['warning message'],
        }),
      );
    });

    it('should intercept console.error calls', () => {
      console.error('error message');

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        'error message',
        expect.objectContaining({
          status: 'error',
          log_level: 'error',
          payload: ['error message'],
        }),
      );
    });

    it('should not intercept console.debug calls by default', () => {
      console.debug('debug message');

      expect(mockEnqueueFn).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      console.log('message', 123, { key: 'value' });

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        'message 123 {"key":"value"}',
        expect.objectContaining({
          log_level: 'log',
          payload: ['message', '123', '{"key":"value"}'],
        }),
      );
    });

    it('should respect options.logLevel', () => {
      consoleLogManager = new ConsoleLogManager(mockEnqueueFn, {
        enabled: true,
        logLevel: 'debug',
      });
      consoleLogManager.startTracking();

      console.debug('debug message');

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        'debug message',
        expect.objectContaining({
          log_level: 'debug',
          payload: ['debug message'],
        }),
      );

      console.log('log message');

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        'log message',
        expect.objectContaining({
          log_level: 'log',
          payload: ['log message'],
        }),
      );
    });
  });

  describe('recursion handling', () => {
    beforeEach(() => {
      consoleLogManager.startTracking();
    });

    it('should handle console calls from within the enqueue function', () => {
      // Mock a scenario where _safeStringify triggers another console.log
      const spy = jest
        .spyOn<any, any>(consoleLogManager as any, '_safeStringify')
        .mockImplementation((val: unknown) => {
          console.log('nested log triggered');
          return String(val);
        });

      console.log('outer log');

      // Expected behavior:
      //  - outer log is captured once
      //  - nested log is triggered, but blocked by inStack
      //  - no infinite loop
      expect(mockEnqueueFn).toHaveBeenCalledTimes(1);
      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['outer log'],
        }),
      );

      spy.mockRestore();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      consoleLogManager.startTracking();
    });

    it('should handle errors in the console observer gracefully', () => {
      const originalSafeStringify = consoleLogManager['_safeStringify'];
      consoleLogManager['_safeStringify'] = jest.fn().mockImplementation(() => {
        throw new Error('Stringify error');
      });

      expect(() => {
        console.log('test message');
      }).not.toThrow();

      consoleLogManager['_safeStringify'] = originalSafeStringify;
    });

    it('should handle errors in stack trace generation', () => {
      const originalGetStackTrace = consoleLogManager['_getStackTrace'];
      consoleLogManager['_getStackTrace'] = jest.fn().mockImplementation(() => {
        throw new Error('Stack trace error');
      });

      expect(() => {
        console.log('test message');
      }).not.toThrow();

      consoleLogManager['_getStackTrace'] = originalGetStackTrace;
    });

    it('should handle when console methods are undefined', () => {
      const originalConsoleLog = console.log;
      console.log = undefined as any;

      expect(() => {
        consoleLogManager.startTracking();
      }).not.toThrow();

      console.log = originalConsoleLog;
    });
  });

  describe('circular dependency handling', () => {
    beforeEach(() => {
      consoleLogManager.startTracking();
    });

    it('should handle circular objects in payload', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => {
        console.log('circular object:', circularObj);
      }).not.toThrow();

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['circular object:', '[Unserializable]'],
        }),
      );
    });

    it('should handle circular arrays in payload', () => {
      const circularArray: any[] = ['test'];
      circularArray.push(circularArray);

      expect(() => {
        console.log('circular array:', circularArray);
      }).not.toThrow();

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['circular array:', '[Unserializable]'],
        }),
      );
    });

    it('should handle complex nested circular structures', () => {
      const obj1: any = { name: 'obj1' };
      const obj2: any = { name: 'obj2', ref: obj1 };
      obj1.ref = obj2;

      expect(() => {
        console.log('nested circular:', obj1, obj2);
      }).not.toThrow();

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['nested circular:', '[Unserializable]', '[Unserializable]'],
        }),
      );
    });
  });

  describe('safe stringify edge cases', () => {
    beforeEach(() => {
      consoleLogManager.startTracking();
    });

    it('should handle null values', () => {
      console.log(null);

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          payload: ['null'],
        }),
      );
    });

    it('should handle undefined values', () => {
      console.log(undefined);

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          payload: ['undefined'],
        }),
      );
    });

    it('should handle functions', () => {
      const testFn = () => 'test';
      console.log(testFn);

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          payload: [expect.stringContaining('() =>')],
        }),
      );
    });

    it('should handle symbols', () => {
      const symbol = Symbol('test');
      console.log(symbol);

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          payload: [expect.stringContaining('Symbol(test)')],
        }),
      );
    });

    it('should handle objects with getters that throw', () => {
      const objWithBadGetter = {};
      Object.defineProperty(objWithBadGetter, 'badProp', {
        get: () => {
          throw new Error('getter error');
        },
      });

      expect(() => {
        console.log(objWithBadGetter);
      }).not.toThrow();

      expect(mockEnqueueFn).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          payload: ['{}'],
        }),
      );
    });
  });

  describe('stack trace handling', () => {
    beforeEach(() => {
      consoleLogManager.startTracking();
    });

    it('should capture stack trace correctly', () => {
      console.log('test message');

      const call = mockEnqueueFn.mock.calls[0];
      const metadata = call[2];

      expect(metadata.trace).toBeDefined();
      expect(Array.isArray(metadata.trace)).toBe(true);
      expect(metadata.trace.length).toBeGreaterThan(0);
    });

    it('should handle stack trace generation errors gracefully', () => {
      const originalGetStackTrace = consoleLogManager['_getStackTrace'];
      consoleLogManager['_getStackTrace'] = jest.fn().mockImplementation(() => {
        throw new Error('Stack trace error');
      });

      expect(() => {
        console.log('test message');
      }).not.toThrow();

      consoleLogManager['_getStackTrace'] = originalGetStackTrace;
    });
  });

  describe('sampling functionality', () => {
    let consoleLogManagerWithSampling: ConsoleLogManager;
    let mockEnqueueFnWithSampling: jest.Mock;

    beforeEach(() => {
      mockEnqueueFnWithSampling = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should log when sampleRate is 1', () => {
      consoleLogManagerWithSampling = new ConsoleLogManager(
        mockEnqueueFnWithSampling,
        { enabled: true, sampleRate: 1 },
      );
      consoleLogManagerWithSampling.startTracking();

      console.log('test message');

      expect(mockEnqueueFnWithSampling).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['test message'],
        }),
      );
    });

    it('should apply sampling when sampleRate is 0.5', () => {
      consoleLogManagerWithSampling = new ConsoleLogManager(
        mockEnqueueFnWithSampling,
        { enabled: true, sampleRate: 0.5 },
      );
      consoleLogManagerWithSampling.startTracking();

      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.3); // 0.3 < 0.5, so should log

      console.log('test message');

      expect(mockEnqueueFnWithSampling).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['test message'],
        }),
      );

      Math.random = originalRandom;
    });

    it('should not log when sampleRate is 0.5 and random value is higher', () => {
      consoleLogManagerWithSampling = new ConsoleLogManager(
        mockEnqueueFnWithSampling,
        { enabled: true, sampleRate: 0.5 },
      );
      consoleLogManagerWithSampling.startTracking();

      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.7); // 0.7 > 0.5, so should not log

      console.log('test message');

      expect(mockEnqueueFnWithSampling).not.toHaveBeenCalled();

      Math.random = originalRandom;
    });

    it('should log when sampleRate is undefined', () => {
      consoleLogManagerWithSampling = new ConsoleLogManager(
        mockEnqueueFnWithSampling,
        { enabled: true },
      );
      consoleLogManagerWithSampling.startTracking();

      console.log('test message');

      expect(mockEnqueueFnWithSampling).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['test message'],
        }),
      );
    });
  });

  describe('console log configuration metadata', () => {
    let consoleLogManagerWithService: ConsoleLogManager;
    let mockEnqueueFnWithService: jest.Mock;

    beforeEach(() => {
      mockEnqueueFnWithService = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should include service name and version in metadata when provided', () => {
      consoleLogManagerWithService = new ConsoleLogManager(
        mockEnqueueFnWithService,
        {
          enabled: true,
          service: 'test-service',
          version: '1.2.3',
        },
      );
      consoleLogManagerWithService.startTracking();

      console.log('test message');

      expect(mockEnqueueFnWithService).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['test message'],
          service: 'test-service',
          version: '1.2.3',
        }),
      );
    });

    it('should include only service name when only service name is provided', () => {
      consoleLogManagerWithService = new ConsoleLogManager(
        mockEnqueueFnWithService,
        {
          enabled: true,
          service: 'test-service',
        },
      );
      consoleLogManagerWithService.startTracking();

      console.log('test message');

      expect(mockEnqueueFnWithService).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['test message'],
          service: 'test-service',
          version: '',
        }),
      );
    });

    it('should include only service version when only service version is provided', () => {
      consoleLogManagerWithService = new ConsoleLogManager(
        mockEnqueueFnWithService,
        {
          enabled: true,
          version: '2.0.0',
        },
      );
      consoleLogManagerWithService.startTracking();

      console.log('test message');

      expect(mockEnqueueFnWithService).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['test message'],
          service: '',
          version: '2.0.0',
        }),
      );
    });

    it('should include only service version when only service version is provided', () => {
      consoleLogManagerWithService = new ConsoleLogManager(
        mockEnqueueFnWithService,
        {
          enabled: true,
          resourceMetadata: {
            podName: 'test',
          },
        },
      );
      consoleLogManagerWithService.startTracking();

      console.log('test message');

      expect(mockEnqueueFnWithService).toHaveBeenCalledWith(
        AutoCaptureEventName.CONSOLE_LOG,
        expect.any(String),
        expect.objectContaining({
          log_level: 'log',
          payload: ['test message'],
          podName: 'test',
        }),
      );
    });
  });
});
