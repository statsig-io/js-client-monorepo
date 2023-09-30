import {
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@sigstat/core';

import { LocalOverrides, makeEmptyOverrides } from './LocalOverrides';

export type ClientPrototype = {
  overrideGate: (name: string, value: boolean | null) => void;
  overrideDynamicConfig: (
    name: string,
    value: Record<string, unknown> | null,
  ) => void;
  overrideExperiment: (
    name: string,
    value: Record<string, unknown> | null,
  ) => void;
  overrideLayer: (name: string, value: Record<string, unknown> | null) => void;
};

export function bind(
  client: PrecomputedEvaluationsInterface | OnDeviceEvaluationsInterface,
): void {
  const overrides = makeEmptyOverrides();

  const wrap = <T extends Array<unknown>, U>(
    fn: (...args: T) => U,
    overrideKey: keyof LocalOverrides,
  ) => {
    return (...args: T): U => {
      const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);

      if (overrides[overrideKey][name] != null) {
        switch (overrideKey) {
          case 'gates':
            return overrides[overrideKey][name] as U;
          case 'configs':
            return {
              name,
              ruleID: 'local_override',
              value: overrides[overrideKey][name],
            } as U;
          case 'layers': {
            const values = overrides[overrideKey][name];
            return {
              name,
              ruleID: 'local_override',
              getValue: (param: string) => values[param],
            } as U;
          }
        }
      }

      return fn(...args);
    };
  };

  if ('updateUser' in client) {
    client.checkGate = wrap(client.checkGate, 'gates');
    client.getDynamicConfig = wrap(client.getDynamicConfig, 'configs');
    client.getExperiment = wrap(client.getExperiment, 'configs');
    client.getLayer = wrap(client.getLayer, 'layers');
  } else {
    client.checkGate = wrap(client.checkGate, 'gates');
    client.getDynamicConfig = wrap(client.getDynamicConfig, 'configs');
    client.getExperiment = wrap(client.getExperiment, 'configs');
    client.getLayer = wrap(client.getLayer, 'layers');
  }

  const createOverrideFunction =
    (category: keyof LocalOverrides) => (name: string, value: unknown) => {
      if (value !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        overrides[category][name] = value as any;
      } else {
        delete overrides[category][name];
      }
    };

  const proto = client as unknown as ClientPrototype;
  proto.overrideGate = createOverrideFunction('gates');
  proto.overrideDynamicConfig = createOverrideFunction('configs');
  proto.overrideExperiment = proto.overrideDynamicConfig;
  proto.overrideLayer = createOverrideFunction('layers');
}
