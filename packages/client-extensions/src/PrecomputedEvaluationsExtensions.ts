import { ClientPrototype, bind } from './LocalOverridesBinding';

declare module '@statsig/precomputed-evaluations' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface PrecomputedEvaluationsClient extends ClientPrototype {}
}

let module: typeof import('@statsig/precomputed-evaluations') | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  module = require('@statsig/precomputed-evaluations');
} catch {
  module = undefined;
}

if (module != null) {
  bind(module.PrecomputedEvaluationsClient.prototype);
}

export { module as PrecomputedEvaluationsExtensions };
