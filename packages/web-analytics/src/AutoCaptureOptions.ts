import { AutoCaptureEvent } from './AutoCaptureEvent';
import { ConsoleLogLevel } from './ConsoleLogManager';

export type AutoCaptureOptions = {
  /**
   * Optional function to filter which auto-capture events should be recorded.
   * If provided, this function will be called for each auto-capture event.
   * Return true to capture the event, false to ignore it.
   *
   * @param event - The auto-capture event to evaluate
   * @returns true if the event should be captured, false otherwise
   */
  eventFilterFunc?: (event: AutoCaptureEvent) => boolean;

  /**
   * Settings for automatically capturing console log events.
   * When enabled, console.log, console.warn, console.error, etc. calls
   * will be automatically tracked as statsig::log_line events.
   */
  consoleLogAutoCaptureSettings?: ConsoleLogAutoCaptureSettings;

  /**
   * Whether to capture text content when copy events occur.
   * When true, the actual text being copied will be sanitized and included in copy event data.
   * When false or undefined, copy events will be tracked without the text content.
   *
   * @default false
   */
  captureCopyText?: boolean;
};

export type ConsoleLogAutoCaptureSettings = {
  /**
   * Whether console log auto-capture is enabled.
   * When true, console method calls will be automatically tracked.
   * When false, console events will not be captured.
   */
  enabled: boolean;

  /**
   * The minimum log level to capture.
   * Only console methods at or above this level will be tracked.
   * For example, if set to 'warn', only console.warn and console.error will be captured.
   *
   * @default 'info' - captures info, log, warn, error levels
   */
  logLevel?: ConsoleLogLevel;

  /**
   * Sampling rate for console log events (0.0 to 1.0).
   * Determines what percentage of console events should be captured.
   * 1.0 means capture all events, 0.5 means capture 50% of events, etc.
   *
   * @default 1.0 - capture all events
   */
  sampleRate?: number;
  maxKeys?: number; // limit on number of keys in an object
  maxDepth?: number; // limit on nesting depth
  maxStringLength?: number; // limit on length of stringified output
};
