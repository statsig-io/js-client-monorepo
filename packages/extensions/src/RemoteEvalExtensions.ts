import { ClientWithOverrides, bind } from './LocalOverridesBinding';

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
let module: typeof import('@dloomb-client/remote-server-eval') | undefined;

declare module '@dloomb-client/remote-server-eval' {
  interface StatsigRemoteServerEvalClient extends ClientWithOverrides {}
}

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  module = require('@dloomb-client/remote-server-eval');
} catch {
  module = undefined;
}

if (module != null) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  bind(module.StatsigRemoteServerEvalClient.prototype);
}

export { module as ExtendedRemoteEvalModule };
