import { StatsigUser } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

import MockPrecomputedClientInitialize from './MockPrecomputedClientInitialize.json';

type EvalType = 'gate' | 'config' | 'experiment' | 'layer';
type ClientAction = (
  client: StatsigClient | StatsigOnDeviceEvalClient,
  name: string,
  user?: StatsigUser,
  flipOption?: boolean,
) => any;

interface TestCase {
  evalFnName: string;
  evalType: EvalType;
  action: ClientAction;
  metadataField: string;
}

export const createTestCases = (isOnDeviceEval: boolean): TestCase[] => [
  {
    evalFnName: 'checkGate',
    evalType: 'gate',
    action: (client, name, user, flipOption) => {
      const options = flipOption ? { disableExposureLog: true } : undefined;
      if (isOnDeviceEval && user) {
        return (client as StatsigOnDeviceEvalClient).checkGate(
          name,
          user,
          options,
        );
      }
      return (client as StatsigClient).checkGate(name, options);
    },
    metadataField: 'gate',
  },
  {
    evalFnName: 'getFeatureGate',
    evalType: 'gate',
    action: (client, name, user, flipOption) => {
      const options = flipOption ? { disableExposureLog: true } : undefined;
      if (isOnDeviceEval && user) {
        return (client as StatsigOnDeviceEvalClient).getFeatureGate(
          name,
          user,
          options,
        );
      }
      return (client as StatsigClient).getFeatureGate(name, options);
    },
    metadataField: 'gate',
  },
  {
    evalFnName: 'getDynamicConfig',
    evalType: 'config',
    action: (client, name, user, flipOption) => {
      const options = flipOption ? { disableExposureLog: true } : undefined;
      if (isOnDeviceEval && user) {
        return (client as StatsigOnDeviceEvalClient).getDynamicConfig(
          name,
          user,
          options,
        );
      }
      return (client as StatsigClient).getDynamicConfig(name, options);
    },
    metadataField: 'config',
  },
  {
    evalFnName: 'getExperiment',
    evalType: 'experiment',
    action: (client, name, user, flipOption) => {
      const options = flipOption ? { disableExposureLog: true } : undefined;
      if (isOnDeviceEval && user) {
        return (client as StatsigOnDeviceEvalClient).getExperiment(
          name,
          user,
          options,
        );
      }
      return (client as StatsigClient).getExperiment(name, options);
    },
    metadataField: 'config',
  },
  {
    evalFnName: 'getLayer',
    evalType: 'layer',
    action: (client, name, user, flipOption) => {
      const options = flipOption ? { disableExposureLog: true } : undefined;
      const layer =
        isOnDeviceEval && user
          ? (client as StatsigOnDeviceEvalClient).getLayer(name, user, options)
          : (client as StatsigClient).getLayer(name, options);
      layer.get('param', 'default');
    },
    metadataField: 'config',
  },
];

export const user = {
  userID: 'a-user',
  customIDs: {
    stableID: 'a-stable-id',
  },
};

export const anotherUser = {
  userID: 'another-user',
  customIDs: {
    stableID: 'another-stable-id',
  },
};

const mockPrecomputeData = JSON.parse(
  JSON.stringify(MockPrecomputedClientInitialize),
);

mockPrecomputeData.user = user;

const anotherMockPrecomputeData = JSON.parse(
  JSON.stringify(MockPrecomputedClientInitialize),
);

anotherMockPrecomputeData.user = anotherUser;

export { mockPrecomputeData };
export { anotherMockPrecomputeData };
