import {
  PrecomputedEvaluationsContext,
  PrecomputedEvaluationsInterface,
  SDK_VERSION,
  StatsigMetadataProvider,
  _fastApproxSizeOf,
} from '@statsig/client-core';

import {
  AsciicastEvent,
  AsciicastEventCode,
  AsciicastEventData,
  AsciicastHeader,
} from './AsciicastTypes';

const TIMEOUT_MS = 1000 * 60 * 60 * 4; // 4 hours
const MAX_RECORDING_STRLEN = 1024 * 1024; // 1 MB

export type StatsigAsciicastHeader = Omit<
  AsciicastHeader,
  'version' | 'width' | 'height' | 'timestamp'
>;

export interface CliRecordingPrivateHooks {
  onResize(width: number, height: number): void;
  onOutput(contents: string): void;
  addCustomEvent(code: AsciicastEventCode, contents: AsciicastEventData): void;
}
export interface CliRecordingAdapter {
  getSize(): { width: number; height: number };
  start(): void;
  stop(): void;
}

export type CliAdapterFactory = (
  hooks: CliRecordingPrivateHooks,
) => CliRecordingAdapter;

export interface CliRecordingOptions {
  /**
   * Override the start timestamp. Defined in milliseconds.
   * @default Date.now()
   */
  startTimestamp?: number;

  asciicastHeader?: StatsigAsciicastHeader;
}

/**
 * CliRecording represents a recording. This is a singleton to ensure there's only one active recording at a time.
 */
export class CliRecording {
  // --- Static methods

  private static _currentRecording: CliRecording | undefined;

  static get currentRecording(): CliRecording | undefined {
    return this._currentRecording;
  }

  public static record(
    client: PrecomputedEvaluationsInterface,
    adapterFactory: CliAdapterFactory,
    options?: CliRecordingOptions,
  ): CliRecording {
    if (!this._currentRecording) {
      this._currentRecording = new CliRecording(
        client,
        adapterFactory,
        options,
      );
    }

    return this._currentRecording;
  }

  public static finish(): void {
    this._currentRecording?.finish();
  }

  public static isRecording(): boolean {
    return this._currentRecording !== undefined;
  }

  // --- End of static methods

  startTimestamp: number;
  endTimestamp?: number;
  recording = true;

  private _client: PrecomputedEvaluationsInterface;
  private _sessionID: string;
  private _adapter: CliRecordingAdapter;
  private _asciicastLines: string[] = [];
  private _payloadSize = 0;
  private _unsubscribe?: () => void;

  private constructor(
    client: PrecomputedEvaluationsInterface,
    adapterFactory: CliAdapterFactory,
    options?: CliRecordingOptions,
  ) {
    this._client = client;
    this._adapter = adapterFactory(this._buildController());

    // Read data from client
    const clientContext = this._client.getContext();
    this._sessionID = this._getSessionIdFromClient(clientContext);

    // Subscribe to events
    const timeout = setTimeout(() => {
      this.finish('timeout');
    }, TIMEOUT_MS);
    const shutdownHandler = () => this.finish();
    const sessionExpiredHandler = () => this.finish();
    this._client.$on('pre_shutdown', shutdownHandler);
    this._client.$on('session_expired', sessionExpiredHandler);
    this._unsubscribe = () => {
      clearTimeout(timeout);
      this._client.off('pre_shutdown', shutdownHandler);
      this._client.off('session_expired', sessionExpiredHandler);
    };

    // Create recording header
    const { width, height } = this._adapter.getSize();
    this.startTimestamp = options?.startTimestamp ?? Date.now();
    const header: AsciicastHeader = {
      ...options?.asciicastHeader,
      version: 2,
      width,
      height,
      timestamp: Math.floor(this.startTimestamp / 1000),
    };
    this._asciicastLines.push(JSON.stringify(header));

    // Start recording
    this._startRecording();
  }

  finish(endReason?: string): void {
    this.endTimestamp = Date.now();

    this._shutdown();

    this._logRecording(endReason);
  }

  /**
   * Start recording
   */
  private _startRecording() {
    StatsigMetadataProvider.add({ isRecordingSession: 'true' });
    this._adapter.start();
  }

  private _buildController(): CliRecordingPrivateHooks {
    return {
      onResize: (width, height) => {
        this._appendEvent('r', `${width}x${height}`);
      },
      onOutput: (contents) => {
        this._appendEvent('o', contents);
      },
      addCustomEvent: (type, contents) => {
        this._appendEvent(type, contents);
      },
    };
  }

  private _appendEvent(type: AsciicastEventCode, content: AsciicastEventData) {
    if (!this.recording) {
      return;
    }
    try {
      if (this._sessionID !== this._getSessionIdFromClient()) {
        this.finish('session_expired');
        return;
      }

      const now = Date.now();

      // Always keep a running end timestamp
      this.endTimestamp = now;

      const asciicastEvent: AsciicastEvent = [
        this._recTime(now),
        type,
        content,
      ];

      const asciicastEventLength = _fastApproxSizeOf(
        asciicastEvent,
        MAX_RECORDING_STRLEN,
      );

      if (this._payloadSize + asciicastEventLength >= MAX_RECORDING_STRLEN) {
        this.finish('max_size_exceeded');
        return;
      }

      this._asciicastLines.push(JSON.stringify(asciicastEvent));
      this._payloadSize += asciicastEventLength;
    } catch (e) {
      // If we get an error here, we need to stop recording to avoid an infinite loop
      this._asciicastLines.push(
        JSON.stringify([
          this._recTime(),
          'e',
          e instanceof Error ? e.message : `${e}`,
        ]),
      );
      this.finish('error');
    }
  }

  /**
   * Create logging event and send it to Statsig
   * @param endReason
   */
  private _logRecording(endReason?: string) {
    const file = this._asciicastLines.join('\n');
    const metadata: Record<string, string | undefined> = {
      session_start_ts: String(this.startTimestamp),
      session_end_ts: String(this.endTimestamp),

      asciinema_events: file,
      asciinema_payload_size: String(file.length),

      session_replay_sdk_version: SDK_VERSION,
      platform: 'cli',

      sdk_instance_id: this._client.getContext().sdkInstanceID,
    };

    if (endReason) {
      metadata[endReason] = 'true';
    }

    this._client.logEvent({
      eventName: 'statsig::session_recording',
      value: this._sessionID,
      metadata,
    });
  }

  private _getSessionIdFromClient(
    context: PrecomputedEvaluationsContext = this._client.getContext(),
  ): string {
    return context.session.data.sessionID;
  }

  private _recTime(now: number = Date.now()): number {
    return (now - this.startTimestamp) / 1000;
  }

  private _shutdown() {
    this.recording = false;

    this._adapter.stop();

    this._unsubscribe?.();
    this._unsubscribe = undefined;

    const handler = () => {
      StatsigMetadataProvider.add({ isRecordingSession: 'false' });
      this._client.off('logs_flushed', handler);
    };
    this._client.$on('logs_flushed', handler);

    CliRecording._currentRecording = undefined;
  }
}
