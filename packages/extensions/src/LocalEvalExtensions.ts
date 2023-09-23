import { ClientWithOverrides, bind } from './LocalOverridesBinding';

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
let module: typeof import('@statsig-client/local-eval') | undefined;

declare module '@statsig-client/local-eval' {
  interface StatsigLocalEvalClient extends ClientWithOverrides {}
}

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  module = require('@statsig-client/local-eval');
} catch {
  module = undefined;
}

if (module != null) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  bind(module.StatsigLocalEvalClient.prototype);
}

export { module as ExtendedLocalEvalModule };
