import { ClientPrototype, bind } from './LocalOverridesBinding';

declare module '@sigstat/precomputed-evaluations' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface PrecomputedEvaluationsClient extends ClientPrototype {}
}

let module: typeof import('@sigstat/precomputed-evaluations') | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  module = require('@sigstat/precomputed-evaluations');
} catch {
  module = undefined;
}

if (module != null) {
  bind(module.PrecomputedEvaluationsClient.prototype);
}

export { module as PrecomputedEvaluationsExtensions };
