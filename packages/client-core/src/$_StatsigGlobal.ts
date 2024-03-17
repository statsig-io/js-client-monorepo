/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type StatsigGlobal = {
  [key: string]: unknown;
  instances?: Set<unknown>;
};

declare global {
  let __STATSIG__: StatsigGlobal | undefined;

  interface Window {
    __STATSIG__: StatsigGlobal | undefined;
  }
}

const _window: any = typeof window !== 'undefined' ? window : {};
const _global: any = typeof global !== 'undefined' ? global : {};
const _globalThis: any = typeof globalThis !== 'undefined' ? globalThis : {};

const statsigGlobal =
  _window.__STATSIG__ ?? _global.__STATSIG__ ?? _globalThis.__STATSIG__ ?? {};

_window.__STATSIG__ = statsigGlobal;
_global.__STATSIG__ = statsigGlobal;
_globalThis.__STATSIG__ = statsigGlobal;
