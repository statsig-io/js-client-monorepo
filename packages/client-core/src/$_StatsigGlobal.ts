/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { StatsigClientInterface } from './ClientInterfaces';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type StatsigGlobal = {
  [key: string]: unknown;
  instances?: Record<string, StatsigClientInterface>;
  lastInstance?: StatsigClientInterface;
  acInstances?: Record<string, unknown>;
  srInstances?: Record<string, unknown>;
  instance: (sdkKey?: string) => StatsigClientInterface | undefined;
};

declare global {
  let __STATSIG__: StatsigGlobal | undefined;

  interface Window {
    __STATSIG__: StatsigGlobal | undefined;
  }
}

export const _getStatsigGlobal = (): StatsigGlobal => {
  return __STATSIG__ ?? statsigGlobal;
};

export const _getInstance = (
  sdkKey: string,
): StatsigClientInterface | undefined => {
  return sdkKey ? __STATSIG__?.instances?.[sdkKey] : __STATSIG__?.lastInstance;
};

const GLOBAL_KEY = '__STATSIG__';

const _window: any = typeof window !== 'undefined' ? window : {};
const _global: any = typeof global !== 'undefined' ? global : {};
const _globalThis: any = typeof globalThis !== 'undefined' ? globalThis : {};

const statsigGlobal: StatsigGlobal = _window[GLOBAL_KEY] ??
  _global[GLOBAL_KEY] ??
  _globalThis[GLOBAL_KEY] ?? {
    instance: _getInstance,
  };

_window[GLOBAL_KEY] = statsigGlobal;
_global[GLOBAL_KEY] = statsigGlobal;
_globalThis[GLOBAL_KEY] = statsigGlobal;
