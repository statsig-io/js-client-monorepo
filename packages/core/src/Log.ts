/* eslint-disable no-console */

function addTag(args: unknown[]) {
  args.unshift('[Statsig]');
  return args; // ['[Statsig]', ...args];
}

export type LogLevel = 'verbose' | 'none';

export abstract class Log {
  static level: LogLevel = 'verbose';

  static info(...args: unknown[]): void {
    if (this.level !== 'none') {
      console.info(...addTag(args));
    }
  }

  static debug(...args: unknown[]): void {
    if (this.level !== 'none') {
      console.debug(...addTag(args));
    }
  }

  static warn(...args: unknown[]): void {
    if (this.level !== 'none') {
      console.warn(...addTag(args));
    }
  }

  static error(...args: unknown[]): void {
    if (this.level !== 'none') {
      console.error(...addTag(args));
    }
  }
}
