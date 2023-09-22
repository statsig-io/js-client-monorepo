import { ClientWithOverrides, bind } from './LocalOverridesBinding';

let module: typeof import('@statsig/remote-eval') | undefined;

declare module '@statsig/remote-eval' {
  interface StatsigRemoteEvalClient extends ClientWithOverrides {}
}

try {
  module = require('@statsig/remote-eval');
} catch {
  module = undefined;
}

if (module != null) {
  bind(module.StatsigRemoteEvalClient.prototype);
}

export { module as ExtendedRemoteEvalModule };
