/* eslint-disable no-console */

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
  static level: LogLevel = LogLevel.Error;

  static info(...args: unknown[]): void {
    if (this.level >= LogLevel.Info) {
      console.info(...addTag(args));
    }
  }

  static debug(...args: unknown[]): void {
    if (this.level >= LogLevel.Debug) {
      console.debug(...addTag(args));
    }
  }

  static warn(...args: unknown[]): void {
    if (this.level >= LogLevel.Warn) {
      console.warn(...addTag(args));
    }
  }

  static error(...args: unknown[]): void {
    if (this.level >= LogLevel.Error) {
      console.error(...addTag(args));
    }
  }
}
