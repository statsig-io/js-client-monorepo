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

export enum LogLevel {
  None = 0,
  Error,
  Warn,
  Info,
  Debug,
}

export abstract class Log {
  static level: LogLevel = LogLevel.Warn;

  static info(...args: unknown[]): void {
    if (this.level >= LogLevel.Info) {
      console.info('\x1b[34m%s\x1b[0m', _INFO, ...addTag(args));
    }
  }

  static debug(...args: unknown[]): void {
    if (this.level >= LogLevel.Debug) {
      console.debug('\x1b[32m%s\x1b[0m', DEBUG, ...addTag(args));
    }
  }

  static warn(...args: unknown[]): void {
    if (this.level >= LogLevel.Warn) {
      console.warn('\x1b[33m%s\x1b[0m', _WARN, ...addTag(args));
    }
  }

  static error(...args: unknown[]): void {
    if (this.level >= LogLevel.Error) {
      console.error('\x1b[31m%s\x1b[0m', ERROR, ...addTag(args));
    }
  }
}
