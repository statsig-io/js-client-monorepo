import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import { StatsigProvider } from '../StatsigProvider';
import useDynamicConfig from '../useDynamicConfig';
import useExperiment from '../useExperiment';
import useFeatureGate from '../useFeatureGate';
import useGateValue from '../useGateValue';
import useLayer from '../useLayer';
import useParameterStore from '../useParameterStore';

type HookFunction =
  | typeof useExperiment
  | typeof useDynamicConfig
  | typeof useLayer
  | typeof useParameterStore
  | typeof useFeatureGate
  | typeof useGateValue;

type HookConfig = {
  hook: HookFunction;
  mockFnName: string;
  testIdPrefix: string;
  defaultValue: any;
};

const HOOKS: Record<string, HookConfig> = {
  useExperiment: {
    hook: useExperiment,
    mockFnName: 'getExperiment',
    testIdPrefix: 'experiment',
    defaultValue: { value: {} },
  },
  useDynamicConfig: {
    hook: useDynamicConfig,
    mockFnName: 'getDynamicConfig',
    testIdPrefix: 'dynamic-config',
    defaultValue: { value: {} },
  },
  useLayer: {
    hook: useLayer,
    mockFnName: 'getLayer',
    testIdPrefix: 'layer',
    defaultValue: { value: {} },
  },
  useParameterStore: {
    hook: useParameterStore,
    mockFnName: 'getParameterStore',
    testIdPrefix: 'parameter-store',
    defaultValue: {},
  },
  useFeatureGate: {
    hook: useFeatureGate,
    mockFnName: 'getFeatureGate',
    testIdPrefix: 'feature-gate',
    defaultValue: { value: false },
  },
  useGateValue: {
    hook: useGateValue,
    mockFnName: 'checkGate',
    testIdPrefix: 'gate',
    defaultValue: false,
  },
};

describe('Hook Memoization Tests', () => {
  Object.entries(HOOKS).forEach(([hookName, config]) => {
    describe(hookName, () => {
      let client: any;

      const MemoizedComponent = ({
        forceRender,
        options = { disableExposureLog: true },
      }: {
        forceRender: number;
        options?: any;
      }) => {
        const value = config.hook('test_name', options);
        return (
          <div data-testid={`${config.testIdPrefix}-value`}>
            {JSON.stringify(value)}_{forceRender}
          </div>
        );
      };

      beforeEach(() => {
        client = MockRemoteServerEvalClient.create();
        client.flush = jest.fn().mockReturnValue(Promise.resolve());
        client[config.mockFnName] = jest
          .fn()
          .mockReturnValue(config.defaultValue);
        (client.loadingStatus as any) = 'Ready';
      });

      it('properly memoizes when options object reference changes, but rerenders when options values change', async () => {
        jest.clearAllMocks();

        const { rerender } = render(
          <StatsigProvider client={client}>
            <MemoizedComponent forceRender={1} />
          </StatsigProvider>,
        );

        await waitFor(() => {
          screen.getByTestId(`${config.testIdPrefix}-value`);
        });

        expect(client[config.mockFnName]).toHaveBeenCalledTimes(1);

        rerender(
          <StatsigProvider client={client}>
            <MemoizedComponent forceRender={2} />
          </StatsigProvider>,
        );

        await waitFor(() => {
          screen.getByTestId(`${config.testIdPrefix}-value`);
        });

        expect(client[config.mockFnName]).toHaveBeenCalledTimes(1);

        // Rerender with different options
        rerender(
          <StatsigProvider client={client}>
            <MemoizedComponent
              forceRender={3}
              options={{ disableExposureLog: false }}
            />
          </StatsigProvider>,
        );

        // Should call again because options actually changed
        expect(client[config.mockFnName]).toHaveBeenCalledTimes(2);
      });
    });
  });
});
