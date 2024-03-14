import { ClientPrototype, bind } from './LocalOverridesBinding';

declare module '@statsig/js-on-device-eval-client' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface StatsigOnDeviceEvalClient extends ClientPrototype {}
}

let module: typeof import('@statsig/js-on-device-eval-client') | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  module = require('@statsig/js-on-device-eval-client');
} catch {
  module = undefined;
}

if (module != null) {
  bind(module.StatsigOnDeviceEvalClient.prototype);
}

export { module as OnDeviceEvaluationsExtensions };
