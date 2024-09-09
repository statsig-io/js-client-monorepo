import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import { SDKType, StatsigClientEventCallback } from '@statsig/client-core';

import { StatsigClientRN } from '../StatsigClientRN';
import { StatsigProviderRN } from '../StatsigProviderRN';

describe('StatsigProviderRN', () => {
  let onStatusChange: StatsigClientEventCallback<any>;
  let client: StatsigClientRN;

  beforeAll(() => {
    client = new StatsigClientRN('', {});

    jest.spyOn(client, 'flush').mockReturnValue(Promise.resolve());

    jest.spyOn(client, '$on').mockImplementation((event, callback) => {
      if (event === 'values_updated') {
        onStatusChange = callback;
      }
    });

    render(
      <StatsigProviderRN client={client}>
        <div data-testid="first-child" />
      </StatsigProviderRN>,
    );
  });

  it('renders children', async () => {
    act(() => {
      (client.loadingStatus as any) = 'Ready';
      onStatusChange({ name: 'values_updated', status: 'Ready', values: null });
    });

    await waitFor(() => screen.getByTestId('first-child'));
  });

  it('sets the rn binding type', () => {
    expect(SDKType._get('')).toBe('javascript-client-rn');
  });
});
