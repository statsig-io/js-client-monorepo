export type StatsigGlobal = {
  [key: string]: unknown;
  ExtraStatsigMetadata?: Record<string, unknown>;
  instances?: Set<unknown>;
};

declare global {
  let __STATSIG__: StatsigGlobal | undefined;

  interface Window {
    __STATSIG__: StatsigGlobal | undefined;
  }
}

const statsigGlobal: StatsigGlobal = {};

if (typeof window !== 'undefined') {
  window.__STATSIG__ = statsigGlobal;
}

if (typeof __STATSIG__ !== 'undefined') {
  __STATSIG__ = statsigGlobal;
}
