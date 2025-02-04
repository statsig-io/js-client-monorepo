/* eslint-disable no-console */

// intentionally spaced for formatting
const DEBUG = ' DEBUG ';
const _INFO = '  INFO ';
const _WARN = '  WARN ';
const ERROR = ' ERROR ';

function addTag(args: unknown[]) {
  args.unshift('[Statsig]');
  return args; // ['[Statsig]', ...args];
}

export const LogLevel = {
  None: 0,
  Error: 1,
  Warn: 2,
  Info: 3,
  Debug: 4,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export abstract class Log {
  static level: LogLevel = LogLevel.Warn;

  static info(...args: unknown[]): void {
    if (Log.level >= LogLevel.Info) {
      console.info(_INFO, ...addTag(args));
    }
  }

  static debug(...args: unknown[]): void {
    if (Log.level >= LogLevel.Debug) {
      console.debug(DEBUG, ...addTag(args));
    }
  }

  static warn(...args: unknown[]): void {
    if (Log.level >= LogLevel.Warn) {
      console.warn(_WARN, ...addTag(args));
    }
  }

  static error(...args: unknown[]): void {
    if (Log.level >= LogLevel.Error) {
      console.error(ERROR, ...addTag(args));
    }
  }
}
