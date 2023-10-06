/* eslint-disable no-console */

function addTag(args: unknown[]) {
  args.unshift('[Statsig]');
  return args; // ['[Statsig]', ...args];
}

export abstract class Log {
  static info(...args: unknown[]): void {
    console.info(...addTag(args));
  }

  static debug(...args: unknown[]): void {
    console.debug(...addTag(args));
  }

  static warn(...args: unknown[]): void {
    console.warn(...addTag(args));
    // console.warn(...args);
  }

  static error(...args: unknown[]): void {
    console.error(...addTag(args));
  }
}
