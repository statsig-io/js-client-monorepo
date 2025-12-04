import { MockLocalStorage } from 'statsig-test-helpers';

import { EventLogger } from '../EventLogger';
import { NetworkCore } from '../NetworkCore';
import { StatsigClientEmitEventFunc } from '../StatsigClientBase';
import { StatsigEventInternal } from '../StatsigEvent';
import { LoggingEnabledOption } from '../StatsigOptionsCommon';

jest.mock('../VisibilityObserving', () => ({
  _subscribeToVisiblityChanged: jest.fn(),
  _isCurrentlyVisible: jest.fn(() => true),
}));

describe('EventLogger', () => {
  let storageMock: MockLocalStorage;
  let eventLogger: EventLogger;
  let mockNetwork: jest.Mocked<NetworkCore>;
  let mockEmitter: jest.Mocked<StatsigClientEmitEventFunc>;

  const SDK_KEY = 'test-sdk-key';
  const FAILED_LOGS_STORAGE_KEY = 'statsig.failed_logs.3713636369';

  beforeEach(() => {
    jest.clearAllMocks();

    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    mockNetwork = {
      post: jest.fn(),
      beacon: jest.fn(),
      isBeaconSupported: jest.fn(() => false),
      setLogEventCompressionMode: jest.fn(),
    } as any;

    mockEmitter = jest.fn();

    eventLogger = new EventLogger(SDK_KEY, mockEmitter, mockNetwork, {
      loggingEnabled: 'disabled',
    });
  });

  afterEach(() => {
    MockLocalStorage.disableMockStorage();
  });

  describe('save failed logs to storage', () => {
    it('should truncate events when they exceed MAX_FAILED_LOGS (5)', () => {
      const events: StatsigEventInternal[] = Array.from(
        { length: 6 },
        (_, i) => ({
          eventName: `test-event-${i}`,
          user: null,
          time: Date.now(),
          metadata: {},
        }),
      );

      (eventLogger as any)._saveFailedLogsToStorage(events);

      const savedEvents = storageMock.getItem(FAILED_LOGS_STORAGE_KEY);

      expect(savedEvents).not.toBeNull();
      const parsedEvents = JSON.parse(
        savedEvents as string,
      ) as StatsigEventInternal[];
      expect(parsedEvents).toHaveLength(5);

      expect(parsedEvents[0].eventName).toBe('test-event-1');
      expect(parsedEvents[4].eventName).toBe('test-event-5');
    });

    it('should handle empty events array', () => {
      const events: StatsigEventInternal[] = [];

      storageMock.setItem(FAILED_LOGS_STORAGE_KEY, JSON.stringify([]));

      (eventLogger as any)._saveFailedLogsToStorage(events);

      expect(events).toHaveLength(0);
      expect(storageMock.getItem(FAILED_LOGS_STORAGE_KEY)).toEqual(
        JSON.stringify([]),
      );
    });

    it('should concat events and save to storage', () => {
      const events: StatsigEventInternal[] = [
        {
          eventName: 'test-event-1',
          user: null,
          time: Date.now(),
          metadata: {},
        },
        {
          eventName: 'test-event-2',
          user: null,
          time: Date.now(),
          metadata: {},
        },
      ];

      storageMock.setItem(FAILED_LOGS_STORAGE_KEY, JSON.stringify(events));

      (eventLogger as any)._saveFailedLogsToStorage(events);

      expect(storageMock.getItem(FAILED_LOGS_STORAGE_KEY)).toEqual(
        JSON.stringify([...events, ...events]),
      );
    });

    it('should handle type mismatch', () => {
      storageMock.setItem(FAILED_LOGS_STORAGE_KEY, 'not-an-array');

      const events: StatsigEventInternal[] = [
        {
          eventName: 'test-event',
          user: null,
          time: Date.now(),
          metadata: {},
        },
      ];

      (eventLogger as any)._saveFailedLogsToStorage(events);

      expect(storageMock.getItem(FAILED_LOGS_STORAGE_KEY)).toEqual(
        JSON.stringify(events),
      );
    });
  });

  describe('error handling', () => {
    it('should handle storage read errors gracefully', () => {
      const events: StatsigEventInternal[] = [
        {
          eventName: 'test-event',
          user: null,
          time: Date.now(),
          metadata: {},
        },
      ];

      storageMock.getItem = () => {
        throw new Error('Storage read error');
      };

      expect(() => {
        (eventLogger as any)._saveFailedLogsToStorage(events);
      }).not.toThrow();
    });

    it('should handle storage write errors gracefully', () => {
      const events: StatsigEventInternal[] = [
        {
          eventName: 'test-event',
          user: null,
          time: Date.now(),
          metadata: {},
        },
      ];

      storageMock.setItem = () => {
        throw new Error('Storage write error');
      };

      expect(() => {
        (eventLogger as any)._saveFailedLogsToStorage(events);
      }).not.toThrow();
    });
  });

  describe('enqueue', () => {
    it('should add event to flush coordinator', () => {
      const loggerWithLoggingEnabled = new EventLogger(
        SDK_KEY,
        mockEmitter,
        mockNetwork,
        {
          loggingEnabled: LoggingEnabledOption.always,
        },
      );

      const event: StatsigEventInternal = {
        eventName: 'test-event',
        user: null,
        time: Date.now(),
        metadata: { test: 'data' },
      };

      const addEventSpy = jest.spyOn(
        (loggerWithLoggingEnabled as any)._flushCoordinator,
        'addEvent',
      );
      const checkQuickFlushSpy = jest.spyOn(
        (loggerWithLoggingEnabled as any)._flushCoordinator,
        'checkQuickFlush',
      );

      loggerWithLoggingEnabled.enqueue(event);

      expect(addEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'test-event',
        }),
      );
      expect(checkQuickFlushSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset', () => {
    it('should clear exposure time map', () => {
      (eventLogger as any)._lastExposureTimeMap = {
        'test-key': Date.now(),
      };

      eventLogger.reset();

      expect((eventLogger as any)._lastExposureTimeMap).toEqual({});
    });

    it('should attempt to flush events', () => {
      const flushSpy = jest.spyOn(eventLogger, 'flush');

      eventLogger.reset();

      expect(flushSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('start', () => {
    it('should start scheduled flush cycle', () => {
      const loggerWithLoggingEnabled = new EventLogger(
        SDK_KEY,
        mockEmitter,
        mockNetwork,
        {
          loggingEnabled: LoggingEnabledOption.always,
        },
      );

      const startScheduledFlushCycleSpy = jest.spyOn(
        (loggerWithLoggingEnabled as any)._flushCoordinator,
        'startScheduledFlushCycle',
      );

      loggerWithLoggingEnabled.start();

      expect(startScheduledFlushCycleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop', () => {
    it('should set isShuttingDown flag', async () => {
      const loggerWithLoggingEnabled = new EventLogger(
        SDK_KEY,
        mockEmitter,
        mockNetwork,
        {
          loggingEnabled: LoggingEnabledOption.always,
        },
      );

      expect((loggerWithLoggingEnabled as any)._isShuttingDown).toBe(false);

      await loggerWithLoggingEnabled.stop();

      expect((loggerWithLoggingEnabled as any)._isShuttingDown).toBe(true);
    });

    it('should call processShutdown on flush coordinator', async () => {
      const loggerWithLoggingEnabled = new EventLogger(
        SDK_KEY,
        mockEmitter,
        mockNetwork,
        {
          loggingEnabled: LoggingEnabledOption.always,
        },
      );

      const processShutdownSpy = jest
        .spyOn(
          (loggerWithLoggingEnabled as any)._flushCoordinator,
          'processShutdown',
        )
        .mockResolvedValue(undefined);

      await loggerWithLoggingEnabled.stop();

      expect(processShutdownSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('flush', () => {
    it('should delegate to flush coordinator', async () => {
      const loggerWithLoggingEnabled = new EventLogger(
        SDK_KEY,
        mockEmitter,
        mockNetwork,
        {
          loggingEnabled: LoggingEnabledOption.always,
        },
      );

      const processManualFlushSpy = jest
        .spyOn(
          (loggerWithLoggingEnabled as any)._flushCoordinator,
          'processManualFlush',
        )
        .mockResolvedValue(undefined);

      await loggerWithLoggingEnabled.flush();

      expect(processManualFlushSpy).toHaveBeenCalledTimes(1);
    });
  });
});
