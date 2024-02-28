import { ClientPrototype, bind } from './LocalOverridesBinding';

declare module '@statsig/on-device-evaluations' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface OnDeviceEvaluationsClient extends ClientPrototype {}
}

let module: typeof import('@statsig/on-device-evaluations') | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  module = require('@statsig/on-device-evaluations');
} catch {
  module = undefined;
}

if (module != null) {
  bind(module.OnDeviceEvaluationsClient.prototype);
}

export { module as OnDeviceEvaluationsExtensions };
