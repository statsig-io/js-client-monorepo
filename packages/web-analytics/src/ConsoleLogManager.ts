/* eslint-disable no-console */
import { _getWindowSafe } from '@statsig/client-core';

import { AutoCaptureEventName } from './AutoCaptureEvent';
import { ConsoleLogAutoCaptureSettings } from './AutoCaptureOptions';
import { _getSafeUrl, _getSafeUrlString, patch } from './utils/commonUtils';
import { _gatherAllMetadata } from './utils/metadataUtils';

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export type ConsoleLogEvent = {
  eventName: 'statsig::console_log';
  value: string;
  metadata: {
    timestamp: string;
    log_level: LogLevel;
    payload: string[];
    trace: string[];
  };
};

export class ConsoleLogManager {
  private _restoreFns: (() => void)[] = [];
  private _isTracking = false;

  constructor(
    private _enqueueFn: (
      eventName: AutoCaptureEventName,
      value: string,
      metadata: Record<string, unknown>,
    ) => void,
    private _options: ConsoleLogAutoCaptureSettings,
  ) {}

  public startTracking(): void {
    if (this._isTracking || !this._options.enabled) return;
    const win = _getWindowSafe();
    if (!win) return;

    this._isTracking = true;
    this._patchConsole();
  }

  public stopTracking(): void {
    if (!this._isTracking) return;
    this._restoreFns.forEach((restore) => restore());
    this._restoreFns = [];
    this._isTracking = false;
  }

  private _patchConsole(): void {
    (['log', 'info', 'warn', 'error', 'debug'] as LogLevel[]).forEach(
      (level) => {
        if (!console[level]) return;

        const original = console[level].bind(console);
        let inStack = false;

        const restore = patch(
          console as unknown as Record<string, unknown>,
          level,
          (originalFn) => {
            return (...args: unknown[]) => {
              originalFn(...args);

              if (inStack) return;
              inStack = true;

              try {
                const payload = args.map((a) => this._safeStringify(a));
                const trace = this._getStackTrace();

                this._enqueueConsoleLog(level, payload, trace);
              } catch (err) {
                original('console observer error:', err, ...args);
              } finally {
                inStack = false;
              }
            };
          },
        );

        this._restoreFns.push(restore);
      },
    );
  }

  private _enqueueConsoleLog(
    level: LogLevel,
    payload: string[],
    trace: string[],
  ): void {
    if (!this._shouldLog()) return;

    const metadata: Record<string, unknown> = {
      log_level: level,
      payload,
      trace,
      timestamp: Date.now(),
      serviceName: this._options.serviceName ?? '',
      serviceVersion: this._options.serviceVersion ?? '',
      ...(this._options.resourceMetadata ?? {}),
      ..._gatherAllMetadata(_getSafeUrl()),
    };

    this._enqueueFn(
      AutoCaptureEventName.CONSOLE_LOG,
      _getSafeUrlString(),
      metadata,
    );
  }

  private _shouldLog(): boolean {
    if (
      !this._options.sampleRate ||
      typeof this._options.sampleRate !== 'number' ||
      this._options.sampleRate <= 0 ||
      this._options.sampleRate >= 1
    ) {
      return true;
    }

    return Math.random() < this._options.sampleRate;
  }

  private _safeStringify(val: unknown): string {
    try {
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return String(val);
    } catch {
      return '[Unserializable]';
    }
  }

  private _getStackTrace(): string[] {
    try {
      return new Error().stack?.split('\n').slice(2) ?? [];
    } catch {
      return [];
    }
  }
}
