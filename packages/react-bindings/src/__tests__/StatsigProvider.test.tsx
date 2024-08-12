import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  SDKType,
  StatsigClientEventCallback,
} from '@statsig/client-core';

import { StatsigProvider } from '../StatsigProvider';

describe('StatsigProvider', () => {
  let onStatusChange: StatsigClientEventCallback<any>;
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;

  beforeAll(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockReturnValue(Promise.resolve());

    client.$on.mockImplementation((event, callback) => {
      if (event === 'values_updated') {
        onStatusChange = callback;
      }
    });

    render(
      <StatsigProvider client={client}>
        <div data-testid="first-child" />
      </StatsigProvider>,
    );
  });

  it('renders children', async () => {
    act(() => {
      (client.loadingStatus as any) = 'Ready';
      onStatusChange({ name: 'values_updated', status: 'Ready', values: null });
    });
    await waitFor(() => screen.getByTestId('first-child'));
  });

  it('sets the react binding type', () => {
    expect(SDKType._get('')).toBe('js-mono-react');
  });
});
