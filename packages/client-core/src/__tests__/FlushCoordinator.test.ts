import { BatchQueue } from '../BatchedEventsQueue';
import { EventBatch } from '../EventBatch';
import { FlushCoordinator } from '../FlushCoordinator';
import { FlushType } from '../FlushTypes';
import { NetworkCore } from '../NetworkCore';
import { PendingEvents } from '../PendingEvents';
import { StatsigClientEmitEventFunc } from '../StatsigClientBase';
import { StatsigEventInternal } from '../StatsigEvent';
import { LoggingEnabledOption } from '../StatsigOptionsCommon';
import { UrlConfiguration } from '../UrlConfiguration';

describe('FlushCoordinator', () => {
  let flushCoordinator: FlushCoordinator;
  let mockBatchQueue: jest.Mocked<BatchQueue>;
  let mockPendingEvents: jest.Mocked<PendingEvents>;
  let mockOnPrepareFlush: jest.Mock;
  let mockNetwork: jest.Mocked<NetworkCore>;
  let mockEmitter: jest.MockedFunction<StatsigClientEmitEventFunc>;
  let mockUrlConfig: UrlConfiguration;

  const SDK_KEY = 'test-sdk-key';

  const createMockEvent = (eventName: string): StatsigEventInternal => ({
    eventName,
    user: null,
    time: Date.now(),
    metadata: {},
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockBatchQueue = {
      takeAllBatches: jest.fn(),
      takeNextBatch: jest.fn(),
      createBatches: jest.fn(),
      hasFullBatch: jest.fn(),
      requeueBatch: jest.fn(),
    } as any;

    mockPendingEvents = {
      addToPendingEventsQueue: jest.fn(),
      hasEventsForFullBatch: jest.fn(),
      takeAll: jest.fn(),
      isEmpty: jest.fn(),
    } as any;

    mockOnPrepareFlush = jest.fn();

    mockNetwork = {
      post: jest.fn(),
      beacon: jest.fn(),
      isBeaconSupported: jest.fn(() => false),
      setLogEventCompressionMode: jest.fn(),
    } as any;

    mockEmitter = jest.fn();
    mockUrlConfig = new UrlConfiguration('rgstr', null, null, null);

    flushCoordinator = new FlushCoordinator(
      mockBatchQueue,
      mockPendingEvents,
      mockOnPrepareFlush,
      SDK_KEY,
      mockNetwork,
      mockEmitter,
      mockUrlConfig,
      null,
      LoggingEnabledOption.always,
    );
  });

  describe('processManualFlush', () => {
    let clearAllTimersSpy: jest.SpyInstance;
    let prepareQueueForFlushSpy: jest.SpyInstance;
    let processOneBatchSpy: jest.SpyInstance;
    let scheduleNextFlushSpy: jest.SpyInstance;

    beforeEach(() => {
      clearAllTimersSpy = jest.spyOn(
        flushCoordinator as any,
        '_clearAllTimers',
      );
      prepareQueueForFlushSpy = jest.spyOn(
        flushCoordinator as any,
        '_prepareQueueForFlush',
      );
      processOneBatchSpy = jest.spyOn(
        flushCoordinator as any,
        '_processOneBatch',
      );
      scheduleNextFlushSpy = jest.spyOn(
        flushCoordinator as any,
        '_scheduleNextFlush',
      );
    });

    it('should clear all timers at the start', async () => {
      mockBatchQueue.takeAllBatches.mockReturnValue([]);

      await flushCoordinator.processManualFlush();

      expect(clearAllTimersSpy).toHaveBeenCalled();
      expect(clearAllTimersSpy.mock.invocationCallOrder[0]).toBeLessThan(
        prepareQueueForFlushSpy.mock.invocationCallOrder[0],
      );
    });

    it('should call _prepareQueueForFlush before taking batches', async () => {
      mockBatchQueue.takeAllBatches.mockReturnValue([]);

      await flushCoordinator.processManualFlush();

      expect(prepareQueueForFlushSpy).toHaveBeenCalledTimes(1);
    });

    it('should take all batches from the batch queue', async () => {
      mockBatchQueue.takeAllBatches.mockReturnValue([]);

      await flushCoordinator.processManualFlush();

      expect(mockBatchQueue.takeAllBatches).toHaveBeenCalledTimes(1);
    });

    it('should return early when there are no batches', async () => {
      mockBatchQueue.takeAllBatches.mockReturnValue([]);

      await flushCoordinator.processManualFlush();

      expect(processOneBatchSpy).not.toHaveBeenCalled();
    });

    it('should process a single batch with FlushType.Manual', async () => {
      const batch = new EventBatch([createMockEvent('event-1')]);
      mockBatchQueue.takeAllBatches.mockReturnValue([batch]);
      processOneBatchSpy.mockResolvedValue(true);

      await flushCoordinator.processManualFlush();

      expect(processOneBatchSpy).toHaveBeenCalledTimes(1);
      expect(processOneBatchSpy).toHaveBeenCalledWith(batch, FlushType.Manual);
    });

    it('should process multiple batches in parallel', async () => {
      const batch1 = new EventBatch([createMockEvent('event-1')]);
      const batch2 = new EventBatch([createMockEvent('event-2')]);
      const batch3 = new EventBatch([createMockEvent('event-3')]);
      mockBatchQueue.takeAllBatches.mockReturnValue([batch1, batch2, batch3]);
      processOneBatchSpy.mockResolvedValue(true);

      await flushCoordinator.processManualFlush();

      expect(processOneBatchSpy).toHaveBeenCalledTimes(3);
      expect(processOneBatchSpy).toHaveBeenCalledWith(batch1, FlushType.Manual);
      expect(processOneBatchSpy).toHaveBeenCalledWith(batch2, FlushType.Manual);
      expect(processOneBatchSpy).toHaveBeenCalledWith(batch3, FlushType.Manual);
    });

    it('should always call _scheduleNextFlush in finally block after success', async () => {
      const batch = new EventBatch([createMockEvent('event-1')]);
      mockBatchQueue.takeAllBatches.mockReturnValue([batch]);
      processOneBatchSpy.mockResolvedValue(true);

      await flushCoordinator.processManualFlush();

      expect(scheduleNextFlushSpy).toHaveBeenCalledTimes(2);
    });

    it('should always call _scheduleNextFlush in finally block when no batches', async () => {
      mockBatchQueue.takeAllBatches.mockReturnValue([]);

      await flushCoordinator.processManualFlush();

      expect(scheduleNextFlushSpy).toHaveBeenCalledTimes(2);
    });

    it('should always call _scheduleNextFlush in finally block even when _processOneBatch fails', async () => {
      const batch = new EventBatch([createMockEvent('event-1')]);
      mockBatchQueue.takeAllBatches.mockReturnValue([batch]);
      processOneBatchSpy.mockResolvedValue(false);

      await flushCoordinator.processManualFlush();

      expect(scheduleNextFlushSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle Promise.all processing batches in parallel', async () => {
      const batches = Array.from(
        { length: 5 },
        (_, i) => new EventBatch([createMockEvent(`event-${i}`)]),
      );
      mockBatchQueue.takeAllBatches.mockReturnValue(batches);
      processOneBatchSpy.mockResolvedValue(true);

      await flushCoordinator.processManualFlush();

      expect(processOneBatchSpy).toHaveBeenCalledTimes(5);
      batches.forEach((batch) => {
        expect(processOneBatchSpy).toHaveBeenCalledWith(
          batch,
          FlushType.Manual,
        );
      });
    });

    it('should handle mixed success and failure in parallel batch processing', async () => {
      const batch1 = new EventBatch([createMockEvent('event-1')]);
      const batch2 = new EventBatch([createMockEvent('event-2')]);
      const batch3 = new EventBatch([createMockEvent('event-3')]);
      mockBatchQueue.takeAllBatches.mockReturnValue([batch1, batch2, batch3]);

      processOneBatchSpy
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      await flushCoordinator.processManualFlush();

      expect(processOneBatchSpy).toHaveBeenCalledTimes(3);
      expect(scheduleNextFlushSpy).toHaveBeenCalledTimes(2);
    });

    it('should not call _processOneBatch if takeAllBatches returns empty array', async () => {
      mockBatchQueue.takeAllBatches.mockReturnValue([]);

      await flushCoordinator.processManualFlush();

      expect(processOneBatchSpy).not.toHaveBeenCalled();
      expect(prepareQueueForFlushSpy).toHaveBeenCalled();
      expect(scheduleNextFlushSpy).toHaveBeenCalled();
    });
  });

  describe('_attemptScheduledFlush', () => {
    let containsAtLeastOneFullBatchSpy: jest.SpyInstance;
    let scheduleNextFlushSpy: jest.SpyInstance;
    let processNextBatchSpy: jest.SpyInstance;
    let flushIntervalSpy: any;

    beforeEach(() => {
      containsAtLeastOneFullBatchSpy = jest.spyOn(
        flushCoordinator,
        'containsAtLeastOneFullBatch',
      );
      scheduleNextFlushSpy = jest.spyOn(
        flushCoordinator as any,
        '_scheduleNextFlush',
      );
      processNextBatchSpy = jest.spyOn(
        flushCoordinator as any,
        '_processNextBatch',
      );

      // Access the private _flushInterval
      flushIntervalSpy = (flushCoordinator as any)._flushInterval;
      jest.spyOn(flushIntervalSpy, 'hasReachedMaxInterval');
      jest.spyOn(flushIntervalSpy, 'markFlushAttempt');
    });

    it('should schedule next flush and return early when no flush conditions are met', () => {
      containsAtLeastOneFullBatchSpy.mockReturnValue(false);
      flushIntervalSpy.hasReachedMaxInterval.mockReturnValue(false);

      (flushCoordinator as any)._attemptScheduledFlush();

      expect(scheduleNextFlushSpy).toHaveBeenCalledTimes(1);
      expect(flushIntervalSpy.markFlushAttempt).not.toHaveBeenCalled();
      expect(processNextBatchSpy).not.toHaveBeenCalled();
    });

    it('should flush with ScheduledFullBatch type when batch is full', async () => {
      containsAtLeastOneFullBatchSpy.mockReturnValue(true);
      flushIntervalSpy.hasReachedMaxInterval.mockReturnValue(false);
      processNextBatchSpy.mockResolvedValue(true);

      (flushCoordinator as any)._attemptScheduledFlush();

      expect(flushIntervalSpy.markFlushAttempt).toHaveBeenCalledTimes(1);
      expect(processNextBatchSpy).toHaveBeenCalledWith(
        FlushType.ScheduledFullBatch,
      );
    });

    it('should flush with ScheduledMaxTime type when max time is reached', async () => {
      containsAtLeastOneFullBatchSpy.mockReturnValue(false);
      flushIntervalSpy.hasReachedMaxInterval.mockReturnValue(true);
      processNextBatchSpy.mockResolvedValue(true);

      (flushCoordinator as any)._attemptScheduledFlush();

      expect(flushIntervalSpy.markFlushAttempt).toHaveBeenCalledTimes(1);
      expect(processNextBatchSpy).toHaveBeenCalledWith(
        FlushType.ScheduledMaxTime,
      );
    });

    it('should call _scheduleNextFlush in finally block after successful flush', async () => {
      containsAtLeastOneFullBatchSpy.mockReturnValue(true);
      flushIntervalSpy.hasReachedMaxInterval.mockReturnValue(false);
      processNextBatchSpy.mockResolvedValue(true);

      (flushCoordinator as any)._attemptScheduledFlush();

      await new Promise(process.nextTick);

      expect(scheduleNextFlushSpy).toHaveBeenCalled();
    });

    it('should call _scheduleNextFlush in finally block even when flush fails', async () => {
      containsAtLeastOneFullBatchSpy.mockReturnValue(true);
      flushIntervalSpy.hasReachedMaxInterval.mockReturnValue(false);
      processNextBatchSpy.mockResolvedValue(false);

      (flushCoordinator as any)._attemptScheduledFlush();

      await new Promise(process.nextTick);

      expect(scheduleNextFlushSpy).toHaveBeenCalled();
    });
  });

  describe('processShutdown', () => {
    let clearAllTimersSpy: jest.SpyInstance;
    let prepareQueueForFlushSpy: jest.SpyInstance;
    let processOneBatchSpy: jest.SpyInstance;

    beforeEach(() => {
      clearAllTimersSpy = jest.spyOn(
        flushCoordinator as any,
        '_clearAllTimers',
      );
      prepareQueueForFlushSpy = jest.spyOn(
        flushCoordinator as any,
        '_prepareQueueForFlush',
      );
      processOneBatchSpy = jest.spyOn(
        flushCoordinator as any,
        '_processOneBatch',
      );
    });

    it('should clear all timers', async () => {
      mockBatchQueue.takeAllBatches.mockReturnValue([]);

      await flushCoordinator.processShutdown();

      expect(clearAllTimersSpy).toHaveBeenCalledTimes(2);
    });

    it('should return early when there are no batches', async () => {
      mockBatchQueue.takeAllBatches.mockReturnValue([]);

      await flushCoordinator.processShutdown();

      expect(prepareQueueForFlushSpy).toHaveBeenCalled();
      expect(mockBatchQueue.takeAllBatches).toHaveBeenCalled();
      expect(processOneBatchSpy).not.toHaveBeenCalled();
    });

    it('should process batches with FlushType.Shutdown', async () => {
      const batch = new EventBatch([createMockEvent('event-1')]);
      mockBatchQueue.takeAllBatches.mockReturnValue([batch]);
      processOneBatchSpy.mockResolvedValue(true);

      await flushCoordinator.processShutdown();

      expect(processOneBatchSpy).toHaveBeenCalledWith(
        batch,
        FlushType.Shutdown,
      );
    });

    it('should process multiple batches in parallel', async () => {
      const batch1 = new EventBatch([createMockEvent('event-1')]);
      const batch2 = new EventBatch([createMockEvent('event-2')]);
      mockBatchQueue.takeAllBatches.mockReturnValue([batch1, batch2]);
      processOneBatchSpy.mockResolvedValue(true);

      await flushCoordinator.processShutdown();

      expect(processOneBatchSpy).toHaveBeenCalledTimes(2);
      expect(processOneBatchSpy).toHaveBeenCalledWith(
        batch1,
        FlushType.Shutdown,
      );
      expect(processOneBatchSpy).toHaveBeenCalledWith(
        batch2,
        FlushType.Shutdown,
      );
    });

    it('should catch and log errors without throwing', async () => {
      const batch = new EventBatch([createMockEvent('event-1')]);
      mockBatchQueue.takeAllBatches.mockReturnValue([batch]);
      processOneBatchSpy.mockRejectedValue(new Error('Shutdown error'));

      await expect(flushCoordinator.processShutdown()).resolves.not.toThrow();
    });
  });

  describe('processLimitFlush', () => {
    let processNextBatchSpy: jest.SpyInstance;
    let scheduleNextFlushSpy: jest.SpyInstance;
    let containsAtLeastOneFullBatchSpy: jest.SpyInstance;
    let flushIntervalSpy: any;

    beforeEach(() => {
      processNextBatchSpy = jest.spyOn(
        flushCoordinator as any,
        '_processNextBatch',
      );
      scheduleNextFlushSpy = jest.spyOn(
        flushCoordinator as any,
        '_scheduleNextFlush',
      );
      containsAtLeastOneFullBatchSpy = jest.spyOn(
        flushCoordinator,
        'containsAtLeastOneFullBatch',
      );

      flushIntervalSpy = (flushCoordinator as any)._flushInterval;
      jest.spyOn(flushIntervalSpy, 'hasCompletelyRecoveredFromBackoff');
    });

    it('should return early when not recovered from backoff', () => {
      flushIntervalSpy.hasCompletelyRecoveredFromBackoff.mockReturnValue(false);

      flushCoordinator.processLimitFlush();

      expect(processNextBatchSpy).not.toHaveBeenCalled();
    });

    it('should process batch with FlushType.Limit when recovered', async () => {
      flushIntervalSpy.hasCompletelyRecoveredFromBackoff.mockReturnValue(true);
      containsAtLeastOneFullBatchSpy.mockReturnValue(false);
      processNextBatchSpy.mockResolvedValue(true);

      flushCoordinator.processLimitFlush();

      await new Promise(process.nextTick);

      expect(processNextBatchSpy).toHaveBeenCalledWith(FlushType.Limit);
    });

    it('should schedule next flush when batch processing fails', async () => {
      flushIntervalSpy.hasCompletelyRecoveredFromBackoff.mockReturnValue(true);
      processNextBatchSpy.mockResolvedValue(false);

      flushCoordinator.processLimitFlush();

      await new Promise(process.nextTick);

      expect(scheduleNextFlushSpy).toHaveBeenCalledTimes(1);
    });

    it('should schedule next flush after successful processing', async () => {
      flushIntervalSpy.hasCompletelyRecoveredFromBackoff.mockReturnValue(true);
      containsAtLeastOneFullBatchSpy.mockReturnValue(false);
      processNextBatchSpy.mockResolvedValue(true);

      flushCoordinator.processLimitFlush();

      await new Promise(process.nextTick);

      expect(scheduleNextFlushSpy).toHaveBeenCalled();
    });

    it('should catch errors and schedule next flush', async () => {
      flushIntervalSpy.hasCompletelyRecoveredFromBackoff.mockReturnValue(true);
      processNextBatchSpy.mockRejectedValue(new Error('Limit flush error'));

      flushCoordinator.processLimitFlush();

      await new Promise(process.nextTick);

      expect(scheduleNextFlushSpy).toHaveBeenCalled();
    });
  });

  describe('checkQuickFlush', () => {
    it('should return early if already run', () => {
      (flushCoordinator as any)._hasRunQuickFlush = true;

      flushCoordinator.checkQuickFlush();

      expect((flushCoordinator as any)._hasRunQuickFlush).toBe(true);
    });

    it('should return early if outside quick flush window', () => {
      (flushCoordinator as any)._creationTime = Date.now() - 100000;

      flushCoordinator.checkQuickFlush();

      expect((flushCoordinator as any)._hasRunQuickFlush).toBe(false);
    });

    it('should set flag and schedule timeout when conditions are met', () => {
      (flushCoordinator as any)._creationTime = Date.now();
      (flushCoordinator as any)._hasRunQuickFlush = false;

      flushCoordinator.checkQuickFlush();

      expect((flushCoordinator as any)._hasRunQuickFlush).toBe(true);
    });
  });
});
