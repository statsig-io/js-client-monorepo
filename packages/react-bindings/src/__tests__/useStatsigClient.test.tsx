import '@testing-library/jest-dom';
import { RenderResult, act, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  DynamicConfig,
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
  StatsigClientEventName,
} from '@statsig/client-core';

import { StatsigProvider } from '../StatsigProvider';
import { useStatsigClient } from '../useStatsigClient';

const GetDynamicConfigComponent = () => {
  const { getDynamicConfig } = useStatsigClient();
  return (
    <div data-testid="config-value">
      {JSON.stringify(getDynamicConfig('a_config'))}
    </div>
  );
};

describe('useStatsigClient', () => {
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;
  let onStatusChange: StatsigClientEventCallback<StatsigClientEventName>;
  let result: RenderResult;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.shutdown.mockReturnValue(Promise.resolve());
    (client.loadingStatus as any) = 'Ready';

    client.__on.mockImplementation((event, callback) => {
      if (event === 'values_updated') {
        onStatusChange = callback;
      }
    });

    client.getDynamicConfig.mockReturnValue({
      name: 'a_config',
      value: { a_string: 'original' },
    } as unknown as DynamicConfig);

    result = render(
      <StatsigProvider client={client}>
        <GetDynamicConfigComponent />
      </StatsigProvider>,
    );
  });

  it('renders the original value', () => {
    const configValue = result.queryByTestId('config-value');
    expect(configValue).toHaveTextContent('"name":"a_config"');
    expect(configValue).toHaveTextContent('"value":{"a_string":"original"}');
  });

  it('reflows the ui on values_updated', async () => {
    client.getDynamicConfig.mockReturnValue({
      name: 'a_config',
      value: { a_string: 'updated' },
    } as unknown as DynamicConfig);

    act(() => {
      onStatusChange({
        name: 'values_updated',
        status: 'Ready',
        values: null,
      });
    });

    await waitFor(() => {
      const configValue = result.queryByTestId('config-value');
      expect(configValue).toHaveTextContent('"name":"a_config"');
      expect(configValue).toHaveTextContent('"value":{"a_string":"updated"}');
    });
  });
});
