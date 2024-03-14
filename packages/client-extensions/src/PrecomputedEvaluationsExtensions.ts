import { ClientPrototype, bind } from './LocalOverridesBinding';

declare module '@statsig/js-client' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface StatsigClient extends ClientPrototype {}
}

let module: typeof import('@statsig/js-client') | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  module = require('@statsig/js-client');
} catch {
  module = undefined;
}

if (module != null) {
  bind(module.StatsigClient.prototype);
}

export { module as PrecomputedEvaluationsExtensions };
