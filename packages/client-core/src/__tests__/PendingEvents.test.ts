import { Log } from '../Log';
import { PendingEvents } from '../PendingEvents';
import { StatsigEventInternal } from '../StatsigEvent';

jest.mock('../Log', () => ({
  Log: {
    debug: jest.fn(),
  },
}));

describe('PendingEvents', () => {
  let pendingEvents: PendingEvents;
  const mockLogDebug = jest.spyOn(Log, 'debug');

  const createMockEvent = (eventName: string): StatsigEventInternal => ({
    eventName,
    user: null,
    time: Date.now(),
    metadata: {},
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with capacity and batch size', () => {
      pendingEvents = new PendingEvents(10);
      expect(pendingEvents).toBeDefined();
    });

    it('should initialize with zero capacity and batch size', () => {
      pendingEvents = new PendingEvents(0);
      expect(pendingEvents).toBeDefined();
    });
  });

  describe('addToPendingEventsQueue', () => {
    beforeEach(() => {
      pendingEvents = new PendingEvents(10);
    });

    it('should add a single event to the queue', () => {
      const event = createMockEvent('test-event');
      pendingEvents.addToPendingEventsQueue(event);

      expect((pendingEvents as any)._pendingEvents).toHaveLength(1);
      expect(mockLogDebug).toHaveBeenCalledWith('Enqueued Event:', event);
    });

    it('should add multiple events to the queue', () => {
      const events = Array.from({ length: 50 }, (_, i) =>
        createMockEvent(`test-event-${i}`),
      );

      events.forEach((event) => {
        pendingEvents.addToPendingEventsQueue(event);
      });

      expect((pendingEvents as any)._pendingEvents).toHaveLength(50);
      expect(mockLogDebug).toHaveBeenCalledTimes(50);
    });

    it('should log each event before adding to queue', () => {
      const event1 = createMockEvent('event-1');
      const event2 = createMockEvent('event-2');

      pendingEvents.addToPendingEventsQueue(event1);
      pendingEvents.addToPendingEventsQueue(event2);

      expect(mockLogDebug).toHaveBeenNthCalledWith(
        1,
        'Enqueued Event:',
        event1,
      );
      expect(mockLogDebug).toHaveBeenNthCalledWith(
        2,
        'Enqueued Event:',
        event2,
      );
    });

    it('should handle events with different properties', () => {
      const event: StatsigEventInternal = {
        eventName: 'custom-event',
        user: { userID: 'user-123' } as any,
        time: 1234567890,
        metadata: { key: 'value' },
        value: 'test-value',
      };

      pendingEvents.addToPendingEventsQueue(event);
      expect((pendingEvents as any)._pendingEvents).toHaveLength(1);
      expect(mockLogDebug).toHaveBeenCalledWith('Enqueued Event:', event);
    });

    it('should handle events with null metadata', () => {
      const event: StatsigEventInternal = {
        eventName: 'event-null-metadata',
        user: null,
        time: Date.now(),
        metadata: null,
      };

      pendingEvents.addToPendingEventsQueue(event);
      expect(mockLogDebug).toHaveBeenCalledWith('Enqueued Event:', event);
    });
  });

  describe('hasEventsForFullBatch', () => {
    beforeEach(() => {
      pendingEvents = new PendingEvents(10);
    });

    it('should return false when queue is empty', () => {
      expect(pendingEvents.hasEventsForFullBatch()).toBe(false);
    });

    it('should return false when queue has fewer events than batch size', () => {
      for (let i = 0; i < 5; i++) {
        pendingEvents.addToPendingEventsQueue(createMockEvent(`event-${i}`));
      }

      expect(pendingEvents.hasEventsForFullBatch()).toBe(false);
    });

    it('should return true when queue has exactly batch size events', () => {
      for (let i = 0; i < 10; i++) {
        pendingEvents.addToPendingEventsQueue(createMockEvent(`event-${i}`));
      }

      expect(pendingEvents.hasEventsForFullBatch()).toBe(true);
    });

    it('should return true when queue has more events than batch size', () => {
      for (let i = 0; i < 15; i++) {
        pendingEvents.addToPendingEventsQueue(createMockEvent(`event-${i}`));
      }

      expect(pendingEvents.hasEventsForFullBatch()).toBe(true);
    });

    it('should return true when batch size is 0 and queue has events', () => {
      pendingEvents = new PendingEvents(0);
      pendingEvents.addToPendingEventsQueue(createMockEvent('event'));

      expect(pendingEvents.hasEventsForFullBatch()).toBe(true);
    });

    it('should return correct value with batch size of 1', () => {
      pendingEvents = new PendingEvents(1);

      expect(pendingEvents.hasEventsForFullBatch()).toBe(false);

      pendingEvents.addToPendingEventsQueue(createMockEvent('event'));

      expect(pendingEvents.hasEventsForFullBatch()).toBe(true);
    });

    it('should update correctly as events are added', () => {
      pendingEvents = new PendingEvents(5);

      expect(pendingEvents.hasEventsForFullBatch()).toBe(false);

      for (let i = 0; i < 4; i++) {
        pendingEvents.addToPendingEventsQueue(createMockEvent(`event-${i}`));
        expect(pendingEvents.hasEventsForFullBatch()).toBe(false);
      }

      pendingEvents.addToPendingEventsQueue(createMockEvent('event-5'));
      expect(pendingEvents.hasEventsForFullBatch()).toBe(true);
    });
  });
});
