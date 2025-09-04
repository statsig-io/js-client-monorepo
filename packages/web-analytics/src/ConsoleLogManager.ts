/* eslint-disable no-console */
import { ErrorBoundary, Log, _getWindowSafe } from '@statsig/client-core';

import { AutoCaptureEventName } from './AutoCaptureEvent';
import { ConsoleLogAutoCaptureSettings } from './AutoCaptureOptions';
import { _getSafeUrl, wrapFunctionWithRestore } from './utils/commonUtils';
import { _getStackTrace, _safeStringify } from './utils/consoleLogsUtils';
import { _gatherAllMetadata } from './utils/metadataUtils';

export type ConsoleLogLevel =
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'debug'
  | 'trace';

const ConsoleLogPriority: Record<ConsoleLogLevel, number> = {
  trace: 10,
  debug: 20,
  log: 30, // log & info are the same priority
  info: 30,
  warn: 40,
  error: 50,
};

const DEFAULT_MAX_KEYS = 10;
const DEFAULT_MAX_DEPTH = 10;
const DEFAULT_MAX_STRING_LENGTH = 500;

export class ConsoleLogManager {
  private _restoreFns: (() => void)[] = [];
  private _isTracking = false;
  private _logLevel: ConsoleLogLevel = 'info';
  private readonly __source = 'js-auto-capture';
  private readonly _maxKeys: number;
  private readonly _maxDepth: number;
  private readonly _maxStringLength: number;

  constructor(
    private _enqueueFn: (
      eventName: AutoCaptureEventName,
      value: string,
      metadata: Record<string, unknown>,
    ) => void,
    private _errorBoundary: ErrorBoundary,
    private _options: ConsoleLogAutoCaptureSettings,
  ) {
    this._logLevel = this._options.logLevel ?? 'info';
    this._maxKeys = this._options.maxKeys ?? DEFAULT_MAX_KEYS;
    this._maxDepth = this._options.maxDepth ?? DEFAULT_MAX_DEPTH;
    this._maxStringLength =
      this._options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;
  }

  public startTracking(): void {
    try {
      if (this._isTracking || !this._options.enabled) return;
      const win = _getWindowSafe();
      if (!win) return;

      this._patchConsole();
      this._isTracking = true;
    } catch (error) {
      Log.error('Error starting console log tracking', error);
      this._errorBoundary.logError('autoCapture:ConsoleLogManager', error);
    }
  }

  public stopTracking(): void {
    if (!this._isTracking) return;
    this._restoreFns.forEach((restore) => restore());
    this._restoreFns = [];
    this._isTracking = false;
  }

  private _patchConsole(): void {
    (Object.entries(ConsoleLogPriority) as [ConsoleLogLevel, number][]).forEach(
      ([level, priority]) => {
        if (priority < ConsoleLogPriority[this._logLevel]) return;
        if (!console[level]) return;

        const original = console[level].bind(console);
        let inStack = false;

        const restore = wrapFunctionWithRestore(
          console as unknown as Record<string, unknown>,
          level,
          (originalFn) => {
            return (...args: unknown[]) => {
              originalFn(...args);

              if (inStack) return;
              inStack = true;

              try {
                const payload = args.map((a) =>
                  _safeStringify(
                    a,
                    this._maxKeys,
                    this._maxDepth,
                    this._maxStringLength,
                  ),
                );
                const trace = _getStackTrace();

                this._enqueueConsoleLog(level, payload, trace);
              } catch (err) {
                original('console observer error:', err, ...args);
                this._errorBoundary.logError(
                  'autoCapture:ConsoleLogManager',
                  err,
                );
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
    level: ConsoleLogLevel,
    payload: string[],
    trace: string[],
  ): void {
    if (!this._shouldLog()) return;

    const metadata: Record<string, unknown> = {
      status: level === 'log' ? 'info' : level,
      log_level: level,
      payload,
      trace,
      timestamp: Date.now(),
      source: this.__source,
      ..._gatherAllMetadata(_getSafeUrl()),
    };

    this._enqueueFn(
      AutoCaptureEventName.CONSOLE_LOG,
      payload.join(' '),
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
}
