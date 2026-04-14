import { EventBatch } from '../EventBatch';
import { EventSender } from '../EventSender';
import { NetworkParam } from '../NetworkConfig';
import { NetworkCore } from '../NetworkCore';
import { SDKType } from '../SDKType';
import { StatsigClientEmitEventFunc } from '../StatsigClientBase';
import { StatsigEventInternal } from '../StatsigEvent';
import { SDK_VERSION } from '../StatsigMetadata';
import { LogEventCompressionMode } from '../StatsigOptionsCommon';
import { UrlConfiguration } from '../UrlConfiguration';
import { _isUnloading } from '../VisibilityObserving';

jest.mock('../VisibilityObserving', () => ({
  _isUnloading: jest.fn(() => false),
}));

describe('EventSender', () => {
  let mockNetwork: jest.Mocked<NetworkCore>;
  let mockEmitter: jest.MockedFunction<StatsigClientEmitEventFunc>;
  let mockUrlConfig: UrlConfiguration;
  let eventSender: EventSender;

  const SDK_KEY = 'test-sdk-key';
  const TEST_OPTIONS = { networkConfig: {} };

  const createMockEvent = (eventName: string): StatsigEventInternal => ({
    eventName,
    user: null,
    time: Date.now(),
    value: null,
    metadata: { test: 'data' },
  });

  const createMockBatch = (eventCount = 3): EventBatch => {
    const events = Array.from({ length: eventCount }, (_, i) =>
      createMockEvent(`test-event-${i}`),
    );
    return new EventBatch(events);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (_isUnloading as jest.MockedFunction<typeof _isUnloading>).mockReturnValue(
      false,
    );

    mockNetwork = {
      post: jest.fn(),
      beacon: jest.fn(),
      isBeaconSupported: jest.fn(),
      setLogEventCompressionMode: jest.fn(),
    } as any;

    mockEmitter = jest.fn();
    mockUrlConfig = new UrlConfiguration('rgstr', null, null, null);

    eventSender = new EventSender(
      SDK_KEY,
      mockNetwork,
      mockEmitter,
      mockUrlConfig,
      TEST_OPTIONS,
    );
  });

  describe('constructor', () => {
    it('should store all dependencies correctly', () => {
      expect(eventSender).toBeInstanceOf(EventSender);
      expect((eventSender as any)._sdkKey).toBe(SDK_KEY);
      expect((eventSender as any)._network).toBe(mockNetwork);
      expect((eventSender as any)._emitter).toBe(mockEmitter);
      expect((eventSender as any)._options).toBe(TEST_OPTIONS);
      expect((eventSender as any)._logEventUrlConfig).toBe(mockUrlConfig);
    });

    it('should accept null options', () => {
      const senderWithNullOptions = new EventSender(
        SDK_KEY,
        mockNetwork,
        mockEmitter,
        mockUrlConfig,
        null,
      );

      expect((senderWithNullOptions as any)._options).toBeNull();
    });
  });

  describe('setLogEventCompressionMode', () => {
    it('should delegate to network.setLogEventCompressionMode', () => {
      eventSender.setLogEventCompressionMode(LogEventCompressionMode.Forced);

      expect(mockNetwork.setLogEventCompressionMode).toHaveBeenCalledWith(
        LogEventCompressionMode.Forced,
      );
      expect(mockNetwork.setLogEventCompressionMode).toHaveBeenCalledTimes(1);
    });

    it('should work with different compression modes', () => {
      eventSender.setLogEventCompressionMode(LogEventCompressionMode.Disabled);
      expect(mockNetwork.setLogEventCompressionMode).toHaveBeenCalledWith(
        LogEventCompressionMode.Disabled,
      );

      eventSender.setLogEventCompressionMode(LogEventCompressionMode.Enabled);
      expect(mockNetwork.setLogEventCompressionMode).toHaveBeenCalledWith(
        LogEventCompressionMode.Enabled,
      );
    });
  });

  describe('sendBatch', () => {
    describe('when logging is enabled', () => {
      describe('sending via POST', () => {
        beforeEach(() => {
          mockNetwork.post.mockResolvedValue({ code: 200, body: null });
        });

        it('should send events via POST successfully', async () => {
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({ success: true, statusCode: 200 });
          expect(mockNetwork.post).toHaveBeenCalledTimes(1);
          expect(mockNetwork.beacon).not.toHaveBeenCalled();
        });

        it('should emit pre_logs_flushed before sending', async () => {
          const batch = createMockBatch(3);

          await eventSender.sendBatch(batch);

          expect(mockEmitter).toHaveBeenCalledWith({
            name: 'pre_logs_flushed',
            events: batch.events,
          });
        });

        it('should emit logs_flushed after successful send', async () => {
          const batch = createMockBatch(3);

          await eventSender.sendBatch(batch);

          expect(mockEmitter).toHaveBeenCalledWith({
            name: 'logs_flushed',
            events: batch.events,
          });
          expect(mockEmitter).toHaveBeenCalledTimes(2); // pre and post
        });

        it('should include correct request data', async () => {
          const batch = createMockBatch(3);

          await eventSender.sendBatch(batch);

          expect(mockNetwork.post).toHaveBeenCalledWith(
            {
              sdkKey: SDK_KEY,
              data: {
                events: batch.events,
              },
              urlConfig: mockUrlConfig,
              retries: 3,
              preserveFailedStatusCode: true,
              isCompressable: true,
              params: {
                [NetworkParam.EventCount]: '3',
              },
              headers: {
                'statsig-event-count': '3',
                'statsig-retry-count': '0',
                'statsig-sdk-type': SDKType._get(SDK_KEY),
                'statsig-sdk-version': SDK_VERSION,
              },
              credentials: 'same-origin',
            },
            expect.any(Object),
          );
        });

        it('should return success for any 2xx status code', async () => {
          const statusCodes = [200, 201, 202, 204, 299];

          for (const code of statusCodes) {
            mockNetwork.post.mockResolvedValue({ code, body: null });
            const batch = createMockBatch(3);

            const result = await eventSender.sendBatch(batch);

            expect(result).toEqual({ success: true, statusCode: code });
          }
        });
      });

      describe('sending via Beacon', () => {
        beforeEach(() => {
          (
            _isUnloading as jest.MockedFunction<typeof _isUnloading>
          ).mockReturnValue(true);
          mockNetwork.isBeaconSupported.mockReturnValue(true);
          mockNetwork.beacon.mockReturnValue(true);
        });

        it('should send events via beacon when page is unloading', async () => {
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({ success: true, statusCode: 200 });
          expect(mockNetwork.beacon).toHaveBeenCalledTimes(1);
          expect(mockNetwork.post).not.toHaveBeenCalled();
        });

        it('should not use beacon if networkOverrideFunc is set', async () => {
          mockNetwork.post.mockResolvedValue({ code: 200, body: null });

          const senderWithOverride = new EventSender(
            SDK_KEY,
            mockNetwork,
            mockEmitter,
            mockUrlConfig,
            {
              networkConfig: {
                networkOverrideFunc: jest.fn(),
              },
            },
          );

          const batch = createMockBatch(3);

          await senderWithOverride.sendBatch(batch);

          expect(mockNetwork.post).toHaveBeenCalled();
          expect(mockNetwork.beacon).not.toHaveBeenCalled();
        });

        it('should not use beacon if beacon is not supported', async () => {
          mockNetwork.isBeaconSupported.mockReturnValue(false);
          mockNetwork.post.mockResolvedValue({ code: 200, body: null });

          const batch = createMockBatch(3);

          await eventSender.sendBatch(batch);

          expect(mockNetwork.post).toHaveBeenCalled();
          expect(mockNetwork.beacon).not.toHaveBeenCalled();
        });

        it('should emit pre_logs_flushed before sending via beacon', async () => {
          const batch = createMockBatch(3);

          await eventSender.sendBatch(batch);

          expect(mockEmitter).toHaveBeenCalledWith({
            name: 'pre_logs_flushed',
            events: batch.events,
          });
        });

        it('should emit logs_flushed after successful beacon send', async () => {
          const batch = createMockBatch(3);

          await eventSender.sendBatch(batch);

          expect(mockEmitter).toHaveBeenCalledWith({
            name: 'logs_flushed',
            events: batch.events,
          });
        });
      });

      describe('error handling', () => {
        it('should handle network POST failure with 4xx status', async () => {
          mockNetwork.post.mockResolvedValue({ code: 404, body: null });
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({ success: false, statusCode: 404 });
          expect(mockEmitter).not.toHaveBeenCalledWith(
            expect.objectContaining({ name: 'logs_flushed' }),
          );
        });

        it('should handle network POST failure with 5xx status', async () => {
          mockNetwork.post.mockResolvedValue({ code: 500, body: null });
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({ success: false, statusCode: 500 });
        });

        it('should handle network POST rejection', async () => {
          mockNetwork.post.mockRejectedValue(new Error('Network error'));
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'event_sender_post_exception',
          });
        });

        it('should handle network POST returning undefined', async () => {
          mockNetwork.post.mockResolvedValue(undefined as any);
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'event_sender_post_returned_undefined',
          });
        });

        it('should use the network failure path when POST returns null', async () => {
          mockNetwork.post.mockImplementation(async (_args, failureInfo) => {
            if (failureInfo) {
              failureInfo.path = 'network_rate_limited';
            }
            return null as any;
          });
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'network_rate_limited',
          });
        });

        it('should use the network failure error message when POST returns null', async () => {
          mockNetwork.post.mockImplementation(async (_args, failureInfo) => {
            if (failureInfo) {
              failureInfo.path = 'network_request_exception_no_response';
              failureInfo.errorMessage = 'TypeError: Failed to fetch';
            }
            return null as any;
          });
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'network_request_exception_no_response',
            failureErrorMessage: 'TypeError: Failed to fetch',
          });
        });

        it('should use the network failure diagnostics when POST returns null', async () => {
          mockNetwork.post.mockImplementation(async (_args, failureInfo) => {
            if (failureInfo) {
              failureInfo.path = 'network_request_exception_no_response';
              failureInfo.diagnosticBucket =
                'cross_origin_custom_headers_preflight_risk';
              failureInfo.diagnosticMetadata = {
                elapsedMsBucket: '<250',
                crossOrigin: 'true',
                hasCustomUrl: 'true',
              };
            }
            return null as any;
          });
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'network_request_exception_no_response',
            failureDiagnosticBucket:
              'cross_origin_custom_headers_preflight_risk',
            failureDiagnosticMetadata: {
              elapsedMsBucket: '<250',
              crossOrigin: 'true',
              hasCustomUrl: 'true',
            },
          });
        });

        it('should use the fallback null path when POST returns null without a network path', async () => {
          mockNetwork.post.mockResolvedValue(null as any);
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'event_sender_post_returned_null',
          });
        });

        it('should handle network POST throws', async () => {
          mockNetwork.post.mockImplementation(() => {
            throw new Error('Unexpected error');
          });
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'event_sender_post_exception',
          });
        });

        it('should handle pre_logs_flushed emitter exceptions', async () => {
          mockNetwork.post.mockResolvedValue({ code: 200, body: null });
          mockEmitter.mockImplementation(() => {
            throw new Error('Emitter error');
          });
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'event_sender_pre_logs_flushed_emitter_exception',
          });
        });

        it('should handle logs_flushed emitter exceptions', async () => {
          mockNetwork.post.mockResolvedValue({ code: 200, body: null });
          mockEmitter
            .mockImplementationOnce(() => {
              /* noop */
            })
            .mockImplementationOnce(() => {
              throw new Error('Emitter error');
            });
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'event_sender_logs_flushed_emitter_exception',
          });
        });

        it('should use the network failure path when beacon returns false', async () => {
          (
            _isUnloading as jest.MockedFunction<typeof _isUnloading>
          ).mockReturnValue(true);
          mockNetwork.isBeaconSupported.mockReturnValue(true);
          mockNetwork.beacon.mockImplementation((_args, failureInfo) => {
            if (failureInfo) {
              failureInfo.path = 'beacon_send_false';
            }
            return false;
          });
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'beacon_send_false',
          });
        });

        it('should use the network failure path when beacon throws', async () => {
          (
            _isUnloading as jest.MockedFunction<typeof _isUnloading>
          ).mockReturnValue(true);
          mockNetwork.isBeaconSupported.mockReturnValue(true);
          mockNetwork.beacon.mockImplementation((_args, failureInfo) => {
            if (failureInfo) {
              failureInfo.path = 'beacon_send_exception';
            }
            throw new Error('Beacon error');
          });
          const batch = createMockBatch(3);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({
            success: false,
            statusCode: -1,
            failurePath: 'beacon_send_exception',
          });
        });

        it('should return failure status code for non-2xx responses', async () => {
          const errorCodes = [100, 199, 300, 301, 400, 401, 403, 404, 500, 503];

          for (const code of errorCodes) {
            mockNetwork.post.mockResolvedValue({ code, body: null });
            const batch = createMockBatch(3);

            const result = await eventSender.sendBatch(batch);

            expect(result.success).toBe(false);
            expect(result.statusCode).toBe(code);
          }
        });
      });

      describe('edge cases', () => {
        it('should handle events with null metadata', async () => {
          mockNetwork.post.mockResolvedValue({ code: 200, body: null });
          const events: StatsigEventInternal[] = [
            {
              eventName: 'test-event',
              user: null,
              time: Date.now(),
              value: null,
              metadata: null,
            },
          ];
          const batch = new EventBatch(events);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({ success: true, statusCode: 200 });
        });

        it('should handle events with complex user objects', async () => {
          mockNetwork.post.mockResolvedValue({ code: 200, body: null });
          const events: StatsigEventInternal[] = [
            {
              eventName: 'test-event',
              user: {
                userID: 'user-123',
                email: 'test@example.com',
                custom: { key: 'value' },
                statsigEnvironment: undefined,
              },
              time: Date.now(),
              value: 'test-value',
              metadata: { context: 'test' },
            },
          ];
          const batch = new EventBatch(events);

          const result = await eventSender.sendBatch(batch);

          expect(result).toEqual({ success: true, statusCode: 200 });
          expect(mockNetwork.post).toHaveBeenCalledWith(
            expect.objectContaining({
              data: {
                events,
              },
            }),
            expect.any(Object),
          );
        });
      });

      describe('request headers', () => {
        beforeEach(() => {
          mockNetwork.post.mockResolvedValue({ code: 200, body: null });
        });

        it('should include statsig-event-count header with correct event count', async () => {
          const batch = createMockBatch(5);

          await eventSender.sendBatch(batch);

          expect(mockNetwork.post).toHaveBeenCalledWith(
            expect.objectContaining({
              headers: expect.objectContaining({
                'statsig-event-count': '5',
              }),
            }),
            expect.any(Object),
          );
        });

        it('should include statsig-sdk-type header', async () => {
          const batch = createMockBatch(2);

          await eventSender.sendBatch(batch);

          expect(mockNetwork.post).toHaveBeenCalledWith(
            expect.objectContaining({
              headers: expect.objectContaining({
                'statsig-sdk-type': SDKType._get(SDK_KEY),
              }),
            }),
            expect.any(Object),
          );
        });

        it('should include statsig-sdk-version header', async () => {
          const batch = createMockBatch(2);

          await eventSender.sendBatch(batch);

          expect(mockNetwork.post).toHaveBeenCalledWith(
            expect.objectContaining({
              headers: expect.objectContaining({
                'statsig-sdk-version': SDK_VERSION,
              }),
            }),
            expect.any(Object),
          );
        });

        it('should include statsig-retry-count header as 0 for initial attempt', async () => {
          const batch = createMockBatch(3);
          expect(batch.attempts).toBe(0);

          await eventSender.sendBatch(batch);

          expect(mockNetwork.post).toHaveBeenCalledWith(
            expect.objectContaining({
              headers: expect.objectContaining({
                'statsig-retry-count': '0',
              }),
            }),
            expect.any(Object),
          );
        });

        it('should include statsig-retry-count header with correct attempt count after retries', async () => {
          const batch = createMockBatch(3);
          batch.incrementAttempts();
          batch.incrementAttempts();
          expect(batch.attempts).toBe(2);

          await eventSender.sendBatch(batch);

          expect(mockNetwork.post).toHaveBeenCalledWith(
            expect.objectContaining({
              headers: expect.objectContaining({
                'statsig-retry-count': '2',
              }),
            }),
            expect.any(Object),
          );
        });

        it('should include all log event headers with correct values for large batch', async () => {
          const batch = createMockBatch(100);
          batch.incrementAttempts();
          batch.incrementAttempts();
          batch.incrementAttempts();

          await eventSender.sendBatch(batch);

          expect(mockNetwork.post).toHaveBeenCalledWith(
            expect.objectContaining({
              headers: {
                'statsig-event-count': '100',
                'statsig-retry-count': '3',
                'statsig-sdk-type': SDKType._get(SDK_KEY),
                'statsig-sdk-version': SDK_VERSION,
              },
            }),
            expect.any(Object),
          );
        });

        it('should include headers in beacon request args', async () => {
          (
            _isUnloading as jest.MockedFunction<typeof _isUnloading>
          ).mockReturnValue(true);
          mockNetwork.isBeaconSupported.mockReturnValue(true);
          mockNetwork.beacon.mockReturnValue(true);

          const batch = createMockBatch(10);
          batch.incrementAttempts();

          await eventSender.sendBatch(batch);

          expect(mockNetwork.beacon).toHaveBeenCalledWith(
            expect.objectContaining({
              headers: {
                'statsig-event-count': '10',
                'statsig-retry-count': '1',
                'statsig-sdk-type': SDKType._get(SDK_KEY),
                'statsig-sdk-version': SDK_VERSION,
              },
            }),
            expect.any(Object),
          );
        });

        it('should update retry count for each send attempt', async () => {
          const batch = createMockBatch(5);

          // First attempt
          await eventSender.sendBatch(batch);
          expect(mockNetwork.post).toHaveBeenLastCalledWith(
            expect.objectContaining({
              headers: expect.objectContaining({
                'statsig-retry-count': '0',
              }),
            }),
            expect.any(Object),
          );

          // Simulate retry
          batch.incrementAttempts();
          await eventSender.sendBatch(batch);
          expect(mockNetwork.post).toHaveBeenLastCalledWith(
            expect.objectContaining({
              headers: expect.objectContaining({
                'statsig-retry-count': '1',
              }),
            }),
            expect.any(Object),
          );

          // Another retry
          batch.incrementAttempts();
          await eventSender.sendBatch(batch);
          expect(mockNetwork.post).toHaveBeenLastCalledWith(
            expect.objectContaining({
              headers: expect.objectContaining({
                'statsig-retry-count': '2',
              }),
            }),
            expect.any(Object),
          );
        });
      });
    });
  });

  describe('multiple sendBatch calls', () => {
    it('should handle multiple sequential successful sends', async () => {
      mockNetwork.post.mockResolvedValue({ code: 200, body: null });

      const batch1 = createMockBatch(3);
      const batch2 = createMockBatch(5);
      const batch3 = createMockBatch(2);

      const result1 = await eventSender.sendBatch(batch1);
      const result2 = await eventSender.sendBatch(batch2);
      const result3 = await eventSender.sendBatch(batch3);

      expect(result1).toEqual({ success: true, statusCode: 200 });
      expect(result2).toEqual({ success: true, statusCode: 200 });
      expect(result3).toEqual({ success: true, statusCode: 200 });
      expect(mockNetwork.post).toHaveBeenCalledTimes(3);
      expect(mockEmitter).toHaveBeenCalledTimes(6); // pre and post for each
    });

    it('keeps failure paths isolated across concurrent sendBatch calls', async () => {
      const pendingRequests: Array<{
        failureInfo?: { path?: string };
        resolve: (value: { code: number; body: string | null } | null) => void;
      }> = [];

      mockNetwork.post.mockImplementation(
        (_args, failureInfo) =>
          new Promise((resolve) => {
            pendingRequests.push({ failureInfo, resolve });
          }),
      );

      const batch1 = createMockBatch(3);
      const batch2 = createMockBatch(5);

      const result1Promise = eventSender.sendBatch(batch1);
      const result2Promise = eventSender.sendBatch(batch2);

      expect(pendingRequests).toHaveLength(2);

      pendingRequests[1].failureInfo!.path =
        'network_request_timed_out_no_response';
      pendingRequests[1].resolve(null);

      pendingRequests[0].failureInfo!.path = 'network_rate_limited';
      pendingRequests[0].resolve(null);

      const [result1, result2] = await Promise.all([
        result1Promise,
        result2Promise,
      ]);

      expect(result1).toEqual({
        success: false,
        statusCode: -1,
        failurePath: 'network_rate_limited',
      });
      expect(result2).toEqual({
        success: false,
        statusCode: -1,
        failurePath: 'network_request_timed_out_no_response',
      });
    });

    it('should handle mixed success and failure sends', async () => {
      mockNetwork.post
        .mockResolvedValueOnce({ code: 200, body: null })
        .mockResolvedValueOnce({ code: 500, body: null })
        .mockResolvedValueOnce({ code: 201, body: null });

      const batch1 = createMockBatch(3);
      const batch2 = createMockBatch(5);
      const batch3 = createMockBatch(2);

      const result1 = await eventSender.sendBatch(batch1);
      const result2 = await eventSender.sendBatch(batch2);
      const result3 = await eventSender.sendBatch(batch3);

      expect(result1).toEqual({ success: true, statusCode: 200 });
      expect(result2).toEqual({ success: false, statusCode: 500 });
      expect(result3).toEqual({ success: true, statusCode: 201 });
    });
  });
});
