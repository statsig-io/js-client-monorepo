import { EventBatch } from './EventBatch';
import { Log } from './Log';
import { NetworkParam } from './NetworkConfig';
import {
  NetworkCore,
  RequestArgsWithData,
  RequestFailureInfo,
} from './NetworkCore';
import { SDKType } from './SDKType';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { SDK_VERSION } from './StatsigMetadata';
import {
  LogEventCompressionMode,
  NetworkConfigCommon,
  StatsigOptionsCommon,
} from './StatsigOptionsCommon';
import { UrlConfiguration } from './UrlConfiguration';
import { _isUnloading } from './VisibilityObserving';

type EventSendResult = {
  success: boolean;
  statusCode: number;
  failurePath?: string;
};

export class EventSender {
  private _network: NetworkCore;
  private _sdkKey: string;
  private _options: StatsigOptionsCommon<NetworkConfigCommon> | null;
  private _logEventUrlConfig: UrlConfiguration;
  private _emitter: StatsigClientEmitEventFunc;

  constructor(
    sdkKey: string,
    network: NetworkCore,
    emitter: StatsigClientEmitEventFunc,
    logEventUrlConfig: UrlConfiguration,
    options: StatsigOptionsCommon<NetworkConfigCommon> | null,
  ) {
    this._sdkKey = sdkKey;
    this._network = network;
    this._emitter = emitter;
    this._options = options;
    this._logEventUrlConfig = logEventUrlConfig;
  }
  setLogEventCompressionMode(mode: LogEventCompressionMode): void {
    this._network.setLogEventCompressionMode(mode);
  }

  async sendBatch(batch: EventBatch): Promise<EventSendResult> {
    let failurePath = 'event_sender_unexpected_exception';
    const transportFailure: RequestFailureInfo = {};

    try {
      const isClosing = _isUnloading();
      const shouldUseBeacon =
        isClosing &&
        this._network.isBeaconSupported() &&
        this._options?.networkConfig?.networkOverrideFunc == null;

      failurePath = 'event_sender_pre_logs_flushed_emitter_exception';
      this._emitter({
        name: 'pre_logs_flushed',
        events: batch.events,
      });

      failurePath = shouldUseBeacon
        ? 'event_sender_unexpected_exception'
        : 'event_sender_post_exception';
      const response = shouldUseBeacon
        ? this._sendEventsViaBeacon(batch, transportFailure)
        : await this._sendEventsViaPost(batch, transportFailure);

      if (response.success) {
        failurePath = 'event_sender_logs_flushed_emitter_exception';
        this._emitter({
          name: 'logs_flushed',
          events: batch.events,
        });
        return response;
      }
      return {
        success: false,
        statusCode: response.statusCode,
        failurePath: response.failurePath,
      };
    } catch (error) {
      Log.warn('Failed to send batch:', error);
      return {
        success: false,
        statusCode: -1,
        failurePath: transportFailure.path ?? failurePath,
      };
    }
  }

  private async _sendEventsViaPost(
    batch: EventBatch,
    failureInfo: RequestFailureInfo,
  ): Promise<EventSendResult> {
    const result = await this._network.post(
      this._getRequestData(batch),
      failureInfo,
    );
    const code = result?.code ?? -1;
    if (code === -1) {
      return {
        success: false,
        statusCode: -1,
        failurePath:
          failureInfo.path ??
          (result === undefined
            ? 'event_sender_post_returned_undefined'
            : 'event_sender_post_returned_null'),
      };
    }
    return { success: code >= 200 && code < 300, statusCode: code };
  }

  private _sendEventsViaBeacon(
    batch: EventBatch,
    failureInfo: RequestFailureInfo,
  ): {
    success: boolean;
    statusCode: number;
    failurePath?: string;
  } {
    const success = this._network.beacon(
      this._getRequestData(batch),
      failureInfo,
    );
    return {
      success,
      statusCode: success ? 200 : -1,
      failurePath: success
        ? undefined
        : failureInfo.path ?? 'beacon_send_false',
    };
  }

  private _getRequestData(batch: EventBatch): RequestArgsWithData {
    return {
      sdkKey: this._sdkKey,
      data: {
        events: batch.events,
      },
      urlConfig: this._logEventUrlConfig,
      retries: 3,
      preserveFailedStatusCode: true,
      isCompressable: true,
      params: {
        [NetworkParam.EventCount]: String(batch.events.length),
      },
      headers: {
        'statsig-event-count': String(batch.events.length),
        'statsig-retry-count': String(batch.attempts),
        'statsig-sdk-type': SDKType._get(this._sdkKey),
        'statsig-sdk-version': SDK_VERSION,
      },
      credentials: 'same-origin',
    };
  }
}
