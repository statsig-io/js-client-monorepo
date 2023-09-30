import { ClientPrototype, bind } from './LocalOverridesBinding';

declare module '@sigstat/on-device-evaluations' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface OnDeviceEvaluationsClient extends ClientPrototype {}
}

let module: typeof import('@sigstat/on-device-evaluations') | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  module = require('@sigstat/on-device-evaluations');
} catch {
  module = undefined;
}

if (module != null) {
  bind(module.OnDeviceEvaluationsClient.prototype);
}

export { module as OnDeviceEvaluationsExtensions };
