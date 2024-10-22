/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { StatsigClientInterface } from './ClientInterfaces';
import { Log } from './Log';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type StatsigGlobal = {
  [key: string]: unknown;
  instances?: Record<string, StatsigClientInterface>;
  firstInstance?: StatsigClientInterface;
  acInstances?: Record<string, unknown>;
  srInstances?: Record<string, unknown>;
  instance: (sdkKey?: string) => StatsigClientInterface | undefined;
};

declare let global: any;

declare global {
  let __STATSIG__: StatsigGlobal | undefined;

  interface Window {
    __STATSIG__: StatsigGlobal | undefined;
  }
}

export const _getStatsigGlobal = (): StatsigGlobal => {
  return __STATSIG__ ? __STATSIG__ : statsigGlobal;
};

export const _getStatsigGlobalFlag = (flag: string): unknown => {
  return _getStatsigGlobal()[flag];
};

export const _getInstance = (
  sdkKey: string,
): StatsigClientInterface | undefined => {
  const gbl = _getStatsigGlobal();
  if (!sdkKey) {
    if (gbl.instances && Object.keys(gbl.instances).length > 1) {
      Log.warn(
        'Call made to Statsig global instance without an SDK key but there is more than one client instance. If you are using mulitple clients, please specify the SDK key.',
      );
    }

    return gbl.firstInstance;
  }

  return gbl.instances && gbl.instances[sdkKey];
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
