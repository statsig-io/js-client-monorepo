import { MockLocalStorage } from 'statsig-test-helpers';

import { EventLogger } from '../EventLogger';
import { NetworkCore } from '../NetworkCore';
import { StatsigClientEmitEventFunc } from '../StatsigClientBase';
import { StatsigEventInternal } from '../StatsigEvent';

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
    it('should truncate events when they exceed MAX_FAILED_LOGS (500)', () => {
      const events: StatsigEventInternal[] = Array.from(
        { length: 600 },
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
      expect(parsedEvents).toHaveLength(500);

      expect(parsedEvents[0].eventName).toBe('test-event-100');
      expect(parsedEvents[499].eventName).toBe('test-event-599');
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
});
