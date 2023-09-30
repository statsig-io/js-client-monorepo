/* eslint-disable no-console */

export abstract class Log {
  static info(...args: unknown[]): void {
    console.info(...args);
  }

  static debug(...args: unknown[]): void {
    console.debug(...args);
  }

  static warn(...args: unknown[]): void {
    console.warn(...args);
  }

  static error(...args: unknown[]): void {
    console.error(...args);
  }
}
