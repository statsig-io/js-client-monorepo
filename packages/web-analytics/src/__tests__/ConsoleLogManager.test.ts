/* eslint-disable no-console */
import { ErrorBoundary } from '@statsig/client-core';

import { AutoCaptureEventName } from '../AutoCaptureEvent';
import { ConsoleLogManager } from '../ConsoleLogManager';

describe('ConsoleLogManager', () => {
  let consoleLogManager: ConsoleLogManager;
  let mockEnqueueFn: jest.Mock;
  let originalConsole: Console;
  const errorBoundary = new ErrorBoundary('sdk-key', {});

  beforeEach(() => {
    mockEnqueueFn = jest.fn();
    consoleLogManager = new ConsoleLogManager(mockEnqueueFn, errorBoundary, {
      enabled: true,
    });
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
      const consoleLogManagerDisabled = new ConsoleLogManager(
        mockEnqueueFn,
        errorBoundary,
        { enabled: false },
      );
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
      consoleLogManager = new ConsoleLogManager(mockEnqueueFn, errorBoundary, {
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

  describe('error handling', () => {
    beforeEach(() => {
      consoleLogManager.startTracking();
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
        errorBoundary,
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
        errorBoundary,
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
        errorBoundary,
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
        errorBoundary,
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
});
