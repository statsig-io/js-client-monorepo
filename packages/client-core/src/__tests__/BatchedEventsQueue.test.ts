import { BatchQueue } from '../BatchedEventsQueue';
import { EventBatch } from '../EventBatch';
import { EventRetryConstants } from '../EventRetryConstants';
import { StatsigEventInternal } from '../StatsigEvent';

jest.mock('../Log', () => ({
  Log: {
    warn: jest.fn(),
  },
}));

describe('BatchQueue', () => {
  let batchQueue: BatchQueue;

  const createMockEvent = (eventName: string): StatsigEventInternal => ({
    eventName,
    user: null,
    time: Date.now(),
    metadata: {},
  });

  beforeEach(() => {
    batchQueue = new BatchQueue();
    jest.clearAllMocks();
  });

  describe('createAndAddBatches', () => {
    it('should create a single batch from events smaller than batch size', () => {
      const events = Array.from({ length: 50 }, (_, i) =>
        createMockEvent(`event-${i}`),
      );

      const droppedCount = batchQueue.createBatches(events);

      expect(droppedCount).toBe(0);
      const batches = (batchQueue as any)._batches as EventBatch[];
      expect(batches).toHaveLength(1);
      expect(batches[0].events).toHaveLength(50);
    });

    it('should create multiple batches from events larger than batch size', () => {
      const events = Array.from({ length: 250 }, (_, i) =>
        createMockEvent(`event-${i}`),
      );

      const droppedCount = batchQueue.createBatches(events);

      expect(droppedCount).toBe(0);
      const batches = (batchQueue as any)._batches as EventBatch[];
      expect(batches).toHaveLength(3);
      expect(batches[0].events).toHaveLength(
        EventRetryConstants.DEFAULT_BATCH_SIZE,
      );
      expect(batches[1].events).toHaveLength(
        EventRetryConstants.DEFAULT_BATCH_SIZE,
      );
      expect(batches[2].events).toHaveLength(50);
    });

    it('should create batch with exactly DEFAULT_BATCH_SIZE events', () => {
      const events = Array.from(
        { length: EventRetryConstants.DEFAULT_BATCH_SIZE },
        (_, i) => createMockEvent(`event-${i}`),
      );

      const droppedCount = batchQueue.createBatches(events);

      expect(droppedCount).toBe(0);
      const batches = (batchQueue as any)._batches as EventBatch[];
      expect(batches).toHaveLength(1);
      expect(batches[0].events).toHaveLength(
        EventRetryConstants.DEFAULT_BATCH_SIZE,
      );
    });

    it('should not modify batch queue or trigger event drop for empty event array', () => {
      for (let i = 0; i < EventRetryConstants.MAX_PENDING_BATCHES; i++) {
        batchQueue.createBatches([createMockEvent(`batch-${i}-event`)]);
      }
      const batches = (batchQueue as any)._batches as EventBatch[];
      expect(batches).toHaveLength(EventRetryConstants.MAX_PENDING_BATCHES);
      const droppedCount = batchQueue.createBatches([]);
      expect(batches).toHaveLength(EventRetryConstants.MAX_PENDING_BATCHES);
      expect(droppedCount).toBe(0);
    });

    it('should drop oldest batches when exceeding MAX_PENDING_BATCHES', () => {
      // Fill queue to exactly MAX_PENDING_BATCHES
      for (let i = 0; i < EventRetryConstants.MAX_PENDING_BATCHES; i++) {
        batchQueue.createBatches([createMockEvent(`batch-${i}-event`)]);
      }

      const batches = (batchQueue as any)._batches as EventBatch[];
      expect(batches).toHaveLength(EventRetryConstants.MAX_PENDING_BATCHES);

      // Add one more. will drop 1
      const droppedCount = batchQueue.createBatches([
        createMockEvent('batch-10-event'),
      ]);
      expect(batches).toHaveLength(EventRetryConstants.MAX_PENDING_BATCHES);

      expect(droppedCount).toBe(1);
      //this checks oldest have been getting dropped
      expect(batches[0].events[0].eventName).toBe('batch-1-event');
    });

    it('should drop multiple oldest batches when adding many new batches', () => {
      // Fill queue to exactly MAX
      for (let i = 0; i < EventRetryConstants.MAX_PENDING_BATCHES; i++) {
        batchQueue.createBatches([createMockEvent(`batch-${i}-event`)]);
      }

      const batches = (batchQueue as any)._batches as EventBatch[];
      expect(batches).toHaveLength(EventRetryConstants.MAX_PENDING_BATCHES);

      // Now add one more to go over the limit (1 batch dropped)
      const droppedCount1 = batchQueue.createBatches([
        createMockEvent('batch-10-event'),
      ]);
      expect(batches).toHaveLength(EventRetryConstants.MAX_PENDING_BATCHES);

      // Add 5 more batches in a single call (500 events is 5 batches of 100). (5 batches dropped)
      const events = Array.from({ length: 500 }, (_, i) =>
        createMockEvent(`overflow-${i}`),
      );
      const droppedCount2 = batchQueue.createBatches(events);

      // Should report 5+1 drops
      expect(droppedCount1 + droppedCount2).toBe(6);
      //this checks oldest have been getting dropped
      expect(batches[0].events[0].eventName).toBe('batch-6-event');
    });

    it('should handle single event', () => {
      const event = createMockEvent('single-event');
      const droppedCount = batchQueue.createBatches([event]);

      expect(droppedCount).toBe(0);
      const batches = (batchQueue as any)._batches as EventBatch[];
      expect(batches).toHaveLength(1);
      expect(batches[0].events).toHaveLength(1);
      expect(batches[0].events[0]).toBe(event);
    });
  });

  describe('requeueBatch', () => {
    it('should successfully requeue a batch when queue is not full', () => {
      const events = [createMockEvent('event-1'), createMockEvent('event-2')];
      const batch = new EventBatch(events);

      const droppedCount = batchQueue.requeueBatch(batch);

      expect(droppedCount).toBe(0);
      const batches = (batchQueue as any)._batches as EventBatch[];
      expect(batches).toHaveLength(1);
      expect(batches[0]).toBe(batch);
    });

    it('should reject batch when queue is full', () => {
      // Fill queue beyond max cap
      for (let i = 0; i < EventRetryConstants.MAX_PENDING_BATCHES; i++) {
        batchQueue.createBatches([createMockEvent(`event-${i}`)]);
      }

      const batch = new EventBatch([
        createMockEvent('overflow-1'),
        createMockEvent('overflow-2'),
        createMockEvent('overflow-3'),
      ]);

      const droppedCount = batchQueue.requeueBatch(batch);

      expect(droppedCount).toBe(1);
    });

    it('should requeue multiple batches sequentially', () => {
      const batch1 = new EventBatch([createMockEvent('batch1-event')]);
      const batch2 = new EventBatch([createMockEvent('batch2-event')]);
      const batch3 = new EventBatch([createMockEvent('batch3-event')]);

      batchQueue.requeueBatch(batch1);
      batchQueue.requeueBatch(batch2);
      batchQueue.requeueBatch(batch3);

      const batches = (batchQueue as any)._batches as EventBatch[];
      expect(batches).toHaveLength(3);
      expect(batches[0]).toBe(batch1);
      expect(batches[1]).toBe(batch2);
      expect(batches[2]).toBe(batch3);
    });

    describe('hasFullBatch', () => {
      it('should return false when queue is empty', () => {
        expect(batchQueue.hasFullBatch()).toBe(false);
      });

      it('should return false when all batches are smaller than batch size', () => {
        batchQueue.createBatches([
          createMockEvent('event-1'),
          createMockEvent('event-2'),
        ]);

        expect(batchQueue.hasFullBatch()).toBe(false);
      });

      it('should return true when at least one batch has DEFAULT_BATCH_SIZE events', () => {
        const events = Array.from(
          { length: EventRetryConstants.DEFAULT_BATCH_SIZE },
          (_, i) => createMockEvent(`event-${i}`),
        );

        batchQueue.createBatches(events);

        expect(batchQueue.hasFullBatch()).toBe(true);
      });

      it('should return true when at least one batch exceeds DEFAULT_BATCH_SIZE', () => {
        const events = Array.from(
          { length: EventRetryConstants.DEFAULT_BATCH_SIZE + 50 },
          (_, i) => createMockEvent(`event-${i}`),
        );

        batchQueue.createBatches(events);

        expect(batchQueue.hasFullBatch()).toBe(true);
      });

      it('should return true when multiple batches exist with at least one full', () => {
        // Add small batch
        batchQueue.createBatches([
          createMockEvent('small-1'),
          createMockEvent('small-2'),
        ]);

        // Add full batch
        const fullBatch = Array.from(
          { length: EventRetryConstants.DEFAULT_BATCH_SIZE },
          (_, i) => createMockEvent(`full-${i}`),
        );
        batchQueue.createBatches(fullBatch);

        expect(batchQueue.hasFullBatch()).toBe(true);
      });

      it('should return true after requeuing a full batch', () => {
        const events = Array.from(
          { length: EventRetryConstants.DEFAULT_BATCH_SIZE },
          (_, i) => createMockEvent(`event-${i}`),
        );
        const batch = new EventBatch(events);

        batchQueue.requeueBatch(batch);

        expect(batchQueue.hasFullBatch()).toBe(true);
      });
    });

    describe('takeAllBatches', () => {
      it('should return empty array when queue is empty', () => {
        const batches = batchQueue.takeAllBatches();

        expect(batches).toEqual([]);
        expect(batches).toHaveLength(0);
      });

      it('should return all batches and clear the queue', () => {
        batchQueue.createBatches([
          createMockEvent('event-1'),
          createMockEvent('event-2'),
        ]);
        batchQueue.createBatches([createMockEvent('event-3')]);

        const batches = batchQueue.takeAllBatches();

        expect(batches).toHaveLength(2);
        expect((batchQueue as any)._batches).toHaveLength(0);
      });

      it('should return correct batch instances', () => {
        const events1 = [createMockEvent('batch1-event1')];
        const events2 = [createMockEvent('batch2-event1')];

        batchQueue.createBatches(events1);
        batchQueue.createBatches(events2);

        const batches = batchQueue.takeAllBatches();

        expect(batches[0].events[0].eventName).toBe('batch1-event1');
        expect(batches[1].events[0].eventName).toBe('batch2-event1');
      });

      it('should handle taking batches multiple times', () => {
        batchQueue.createBatches([createMockEvent('event-1')]);
        const firstTake = batchQueue.takeAllBatches();
        expect(firstTake).toHaveLength(1);

        const secondTake = batchQueue.takeAllBatches();
        expect(secondTake).toHaveLength(0);

        batchQueue.createBatches([createMockEvent('event-2')]);
        const thirdTake = batchQueue.takeAllBatches();
        expect(thirdTake).toHaveLength(1);
        expect(thirdTake[0].events[0].eventName).toBe('event-2');
      });

      it('should return batches with correct EventBatch properties', () => {
        const events = [createMockEvent('test-event')];
        batchQueue.createBatches(events);

        const batches = batchQueue.takeAllBatches();

        expect(batches[0]).toBeInstanceOf(EventBatch);
        expect(batches[0].attempts).toBe(0);
        expect(batches[0].createdAt).toBeDefined();
        expect(typeof batches[0].createdAt).toBe('number');
      });
    });
  });
});
