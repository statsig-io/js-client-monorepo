import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  SDKType,
  StatsigClientEventCallback,
} from '@statsig/client-core';

import { StatsigProviderRN } from '../StatsigProviderRN';

jest.mock('react-native', () => ({
  NativeModules: {},
  Platform: {},
  AppState: { addEventListener: jest.fn() },
}));

jest.mock('react-native-device-info', () => ({
  default: {
    getVersion: () => '1.2.3',
    getSystemVersion: () => '4.20.0',
    getSystemName: () => 'Android',
    getModel: () => 'Pixel 2',
    getDeviceId: () => 'goldfish',
  },
}));

describe('StatsigProviderRN', () => {
  let onStatusChange: StatsigClientEventCallback<any>;
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;

  beforeAll(() => {
    client = MockRemoteServerEvalClient.create();
    client.shutdown.mockReturnValue(Promise.resolve());

    client.$on.mockImplementation((event, callback) => {
      if (event === 'values_updated') {
        onStatusChange = callback;
      }
    });

    const warming = { result: Promise.resolve(), isResolved: true };

    render(
      <StatsigProviderRN cacheWarming={warming} client={client}>
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
    expect(SDKType._get('')).toBe('js-mono-rn');
  });
});
