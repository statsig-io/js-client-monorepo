import type { eventWithTime, listenerHandler } from '@rrweb/types';
import * as rrweb from 'rrweb';

import { Flatten, _getDocumentSafe } from '@statsig/client-core';

const TIMEOUT_MS = 1000 * 60 * 60 * 4; // 4 hours

export type ReplayEvent = Flatten<eventWithTime & { eventIndex: number }>;

export type RRWebConfig = Omit<rrweb.recordOptions<unknown>, 'emit'>;

export type ReplaySessionData = {
  startTime: number;
  endTime: number;
  clickCount: number;
};

export class SessionReplayClient {
  private _stopFn: (() => void) | undefined;
  private _stopCallback?: () => void;
  private _startTimestamp: null | number = null;
  private _endTimestamp: null | number = null;
  private _clickCount = 0;
  private _eventCounter = 0;

  public record(
    callback: (latest: ReplayEvent, data: ReplaySessionData) => void,
    config: RRWebConfig,
    stopCallback?: () => void,
  ): void {
    if (_getDocumentSafe() == null) {
      return;
    }

    // Always reset session id and tracking fields for a new recording
    this._startTimestamp = null;
    this._endTimestamp = null;
    this._clickCount = 0;
    this._eventCounter = 0;
    this._stopCallback = stopCallback;

    if (this._stopFn) {
      return;
    }

    const emit = (event: eventWithTime) => {
      // Reset start only for the first event
      this._startTimestamp ??= event.timestamp;

      // Always keep a running end timestamp
      this._endTimestamp = event.timestamp;

      // Count clicks only for events representing a click
      if (_isClickEvent(event)) {
        this._clickCount++;
      }

      callback(
        {
          ...event,
          eventIndex: this._eventCounter++,
        },
        {
          startTime: this._startTimestamp,
          endTime: this._endTimestamp,
          clickCount: this._clickCount,
        },
      );

      if (this._endTimestamp - this._startTimestamp > TIMEOUT_MS) {
        this._stopFn?.();

        if (this._stopCallback) {
          this._stopCallback();
        }
      }
    };

    this._stopFn = _minifiedAwareRecord(emit, config);
  }

  public stop(): void {
    if (this._stopFn) {
      this._stopFn();
      this._stopFn = undefined;
    }
  }

  public isRecording(): boolean {
    return this._stopFn != null;
  }
}

/**
 * We do a simple concat of rrweb during minification.
 * This function ensures we handle both "npm" and "<script ..>" install options.
 */
function _minifiedAwareRecord(
  emit: (event: eventWithTime) => void,
  config: RRWebConfig,
): listenerHandler | undefined {
  const record = typeof rrweb === 'function' ? rrweb : rrweb.record;
  return record({ ...config, emit });
}

function _isClickEvent(event: eventWithTime) {
  // we use the raw number so we can support the minified rrweb file.
  return (
    event.type === 3 && // rrweb.EventType.IncrementalSnapshot &&
    event.data.source === 2 && // rrweb.IncrementalSource.MouseInteraction &&
    (event.data.type === 2 /* rrweb.MouseInteractions.Click */ ||
      event.data.type === 4) /* rrweb.MouseInteractions.DbClick */
  );
}
