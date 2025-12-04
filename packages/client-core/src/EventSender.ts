import { EventBatch } from './EventBatch';
import { Log } from './Log';
import { NetworkParam } from './NetworkConfig';
import { NetworkCore, RequestArgsWithData } from './NetworkCore';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { StatsigEventInternal } from './StatsigEvent';
import {
  LogEventCompressionMode,
  LoggingEnabledOption,
  NetworkConfigCommon,
  StatsigOptionsCommon,
} from './StatsigOptionsCommon';
import { UrlConfiguration } from './UrlConfiguration';
import { _isUnloading } from './VisibilityObserving';

export class EventSender {
  private _network: NetworkCore;
  private _sdkKey: string;
  private _options: StatsigOptionsCommon<NetworkConfigCommon> | null;
  private _logEventUrlConfig: UrlConfiguration;
  private _emitter: StatsigClientEmitEventFunc;
  private _loggingEnabled: LoggingEnabledOption;

  constructor(
    sdkKey: string,
    network: NetworkCore,
    emitter: StatsigClientEmitEventFunc,
    logEventUrlConfig: UrlConfiguration,
    options: StatsigOptionsCommon<NetworkConfigCommon> | null,
    loggingEnabled: LoggingEnabledOption,
  ) {
    this._sdkKey = sdkKey;
    this._network = network;
    this._emitter = emitter;
    this._options = options;
    this._logEventUrlConfig = logEventUrlConfig;
    this._loggingEnabled = loggingEnabled;
  }
  setLogEventCompressionMode(mode: LogEventCompressionMode): void {
    this._network.setLogEventCompressionMode(mode);
  }

  setLoggingEnabled(enabled: LoggingEnabledOption): void {
    this._loggingEnabled = enabled;
  }

  async sendBatch(
    batch: EventBatch,
  ): Promise<{ success: boolean; statusCode: number }> {
    try {
      const isClosing = _isUnloading();
      const shouldUseBeacon =
        isClosing &&
        this._network.isBeaconSupported() &&
        this._options?.networkConfig?.networkOverrideFunc == null;

      this._emitter({
        name: 'pre_logs_flushed',
        events: batch.events,
      });

      const response = shouldUseBeacon
        ? this._sendEventsViaBeacon(batch.events)
        : await this._sendEventsViaPost(batch.events);

      if (response.success) {
        this._emitter({
          name: 'logs_flushed',
          events: batch.events,
        });
        return response;
      }
      return { success: false, statusCode: -1 };
    } catch (error) {
      Log.warn('Failed to send batch:', error);
      return { success: false, statusCode: -1 };
    }
  }

  private async _sendEventsViaPost(
    events: StatsigEventInternal[],
  ): Promise<{ success: boolean; statusCode: number }> {
    const result = await this._network.post(this._getRequestData(events));
    const code = result?.code ?? -1;
    return { success: code >= 200 && code < 300, statusCode: code };
  }

  private _sendEventsViaBeacon(events: StatsigEventInternal[]): {
    success: boolean;
    statusCode: number;
  } {
    const success = this._network.beacon(this._getRequestData(events));
    return {
      success,
      statusCode: success ? 200 : -1,
    };
  }

  private _getRequestData(events: StatsigEventInternal[]): RequestArgsWithData {
    return {
      sdkKey: this._sdkKey,
      data: {
        events,
      },
      urlConfig: this._logEventUrlConfig,
      retries: 3,
      isCompressable: true,
      params: {
        [NetworkParam.EventCount]: String(events.length),
      },
      credentials: 'same-origin',
    };
  }
}
