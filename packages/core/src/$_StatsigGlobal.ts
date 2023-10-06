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

const statsigGlobal: StatsigGlobal = {};

if (typeof window !== 'undefined') {
  window.__STATSIG__ = statsigGlobal;
}

if (typeof global !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (global as any).__STATSIG__ = statsigGlobal;
}

if (typeof globalThis !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (globalThis as any).__STATSIG__ = statsigGlobal;
}
