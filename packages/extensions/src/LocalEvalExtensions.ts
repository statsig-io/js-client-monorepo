import { ClientWithOverrides, bind } from './LocalOverridesBinding';

let module: typeof import('@statsig/local-eval') | undefined;

declare module '@statsig/local-eval' {
  interface StatsigLocalEvalClient extends ClientWithOverrides {}
}

try {
  module = require('@statsig/local-eval');
} catch {
  module = undefined;
}

if (module != null) {
  bind(module.StatsigLocalEvalClient.prototype);
}

export { module as ExtendedLocalEvalModule };
