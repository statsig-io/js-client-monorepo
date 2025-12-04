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
  const STORAGE_KEY = 'statsig.pending_events.3713636369';

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

  describe('save events to storage when logging disabled', () => {
    it('should save individual event to storage', () => {
      const event: StatsigEventInternal = {
        eventName: 'test-event',
        user: null,
        time: Date.now(),
        metadata: {},
      };

      (eventLogger as any)._storeEventToStorage(event);

      const savedEvents = storageMock.getItem(STORAGE_KEY);
      expect(savedEvents).not.toBeNull();

      const parsedEvents = JSON.parse(
        savedEvents as string,
      ) as StatsigEventInternal[];
      expect(parsedEvents).toHaveLength(1);
      expect(parsedEvents[0].eventName).toBe('test-event');
    });

    it('should concatenate events when saving multiple times', () => {
      const event1: StatsigEventInternal = {
        eventName: 'test-event-1',
        user: null,
        time: Date.now(),
        metadata: {},
      };

      const event2: StatsigEventInternal = {
        eventName: 'test-event-2',
        user: null,
        time: Date.now(),
        metadata: {},
      };

      (eventLogger as any)._storeEventToStorage(event1);
      (eventLogger as any)._storeEventToStorage(event2);

      const savedEvents = storageMock.getItem(STORAGE_KEY);
      const parsedEvents = JSON.parse(
        savedEvents as string,
      ) as StatsigEventInternal[];

      expect(parsedEvents).toHaveLength(2);
      expect(parsedEvents[0].eventName).toBe('test-event-1');
      expect(parsedEvents[1].eventName).toBe('test-event-2');
    });

    it('should truncate events when they exceed MAX_QUEUED_EVENTS', () => {
      const existingEvents: StatsigEventInternal[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          eventName: `existing-event-${i}`,
          user: null,
          time: Date.now(),
          metadata: {},
        }),
      );

      storageMock.setItem(STORAGE_KEY, JSON.stringify(existingEvents));

      const newEvent: StatsigEventInternal = {
        eventName: 'new-event',
        user: null,
        time: Date.now(),
        metadata: {},
      };

      (eventLogger as any)._storeEventToStorage(newEvent);

      const savedEvents = storageMock.getItem(STORAGE_KEY);
      const parsedEvents = JSON.parse(
        savedEvents as string,
      ) as StatsigEventInternal[];

      // Should still be 1000 (oldest event removed, new event added)
      expect(parsedEvents).toHaveLength(1000);
      // First event should now be existing-event-1
      expect(parsedEvents[0].eventName).toBe('existing-event-1');
      // Last event should be the new-event
      expect(parsedEvents[999].eventName).toBe('new-event');
    });
  });

  describe('error handling', () => {
    it('should handle storage read errors gracefully', () => {
      const event: StatsigEventInternal = {
        eventName: 'test-event',
        user: null,
        time: Date.now(),
        metadata: {},
      };

      storageMock.getItem = () => {
        throw new Error('Storage read error');
      };

      expect(() => {
        (eventLogger as any)._storeEventToStorage(event);
      }).not.toThrow();
    });

    it('should handle storage write errors gracefully', () => {
      const event: StatsigEventInternal = {
        eventName: 'test-event',
        user: null,
        time: Date.now(),
        metadata: {},
      };

      storageMock.setItem = () => {
        throw new Error('Storage write error');
      };

      expect(() => {
        (eventLogger as any)._storeEventToStorage(event);
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

    it('should save event to storage when logging is disabled', () => {
      const event: StatsigEventInternal = {
        eventName: 'test-event',
        user: null,
        time: Date.now(),
        metadata: { test: 'data' },
      };

      const addEventSpy = jest.spyOn(
        (eventLogger as any)._flushCoordinator,
        'addEvent',
      );

      eventLogger.enqueue(event);

      expect(addEventSpy).not.toHaveBeenCalled();

      const savedEvents = storageMock.getItem(STORAGE_KEY);
      expect(savedEvents).not.toBeNull();

      const parsedEvents = JSON.parse(
        savedEvents as string,
      ) as StatsigEventInternal[];
      expect(parsedEvents).toHaveLength(1);
      expect(parsedEvents[0].eventName).toBe('test-event');
    });

    it('should normalize event before saving to storage when disabled', () => {
      const event: StatsigEventInternal = {
        eventName: 'test-event',
        user: {
          userID: 'test-user',
          privateAttributes: { secret: 'data' },
          statsigEnvironment: undefined,
        },
        time: Date.now(),
        metadata: {},
      };

      eventLogger.enqueue(event);

      const savedEvents = storageMock.getItem(STORAGE_KEY);
      const parsedEvents = JSON.parse(
        savedEvents as string,
      ) as StatsigEventInternal[];

      expect(parsedEvents[0].user?.privateAttributes).toBeUndefined();
      expect(parsedEvents[0].user?.userID).toBe('test-user');
    });
  });

  describe('setLoggingEnabled', () => {
    it('should load and enqueue stored events when switching from disabled to enabled', () => {
      const storedEvents: StatsigEventInternal[] = [
        {
          eventName: 'stored-event-1',
          user: null,
          time: Date.now(),
          metadata: {},
        },
        {
          eventName: 'stored-event-2',
          user: null,
          time: Date.now(),
          metadata: {},
        },
      ];

      storageMock.setItem(STORAGE_KEY, JSON.stringify(storedEvents));

      const addEventSpy = jest.spyOn(
        (eventLogger as any)._flushCoordinator,
        'addEvent',
      );
      const flushSpy = jest
        .spyOn(eventLogger, 'flush')
        .mockResolvedValue(undefined);

      eventLogger.setLoggingEnabled(LoggingEnabledOption.always);

      expect(addEventSpy).toHaveBeenCalledTimes(2);
      expect(addEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: 'stored-event-1' }),
      );
      expect(addEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: 'stored-event-2' }),
      );

      expect(flushSpy).toHaveBeenCalledTimes(1);

      expect(storageMock.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should not flush if no stored events when enabling logging', () => {
      const flushSpy = jest.spyOn(eventLogger, 'flush');

      eventLogger.setLoggingEnabled(LoggingEnabledOption.always);

      expect(flushSpy).not.toHaveBeenCalled();
    });

    it('should handle flush errors gracefully when re-enabling', () => {
      const storedEvents: StatsigEventInternal[] = [
        {
          eventName: 'stored-event',
          user: null,
          time: Date.now(),
          metadata: {},
        },
      ];

      storageMock.setItem(STORAGE_KEY, JSON.stringify(storedEvents));

      jest
        .spyOn(eventLogger, 'flush')
        .mockRejectedValue(new Error('Flush failed'));

      expect(() => {
        eventLogger.setLoggingEnabled(LoggingEnabledOption.always);
      }).not.toThrow();
    });

    it('should not load storage when switching between enabled states', () => {
      const loggerEnabled = new EventLogger(SDK_KEY, mockEmitter, mockNetwork, {
        loggingEnabled: LoggingEnabledOption.browserOnly,
      });

      storageMock.setItem(
        STORAGE_KEY,
        JSON.stringify([
          { eventName: 'test', user: null, time: Date.now(), metadata: {} },
        ]),
      );

      const loadSpy = jest.spyOn(loggerEnabled as any, '_loadStoredEvents');

      loggerEnabled.setLoggingEnabled(LoggingEnabledOption.always);

      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('should update flush coordinator logging state', () => {
      const setLoggingSpy = jest.spyOn(
        (eventLogger as any)._flushCoordinator,
        'setLoggingEnabled',
      );

      eventLogger.setLoggingEnabled(LoggingEnabledOption.always);

      expect(setLoggingSpy).toHaveBeenCalledWith(LoggingEnabledOption.always);
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
