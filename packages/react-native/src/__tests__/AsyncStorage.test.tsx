import { render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';
import { StatsigProvider } from '../index';

import {
  MockRemoteServerEvalClient,
  TestPromise,
} from '@statsig-client/test-helpers';

describe('StatsigProvider', () => {
  it('renders children', async () => {
    const client = MockRemoteServerEvalClient.create();

    const promise = TestPromise.create<void>();
    client.initialize.mockReturnValue(promise);

    promise.resolve();

    render(
      <StatsigProvider client={client}>
        <Text>Fooo</Text>
      </StatsigProvider>,
    );

    await waitFor(() => screen.getByText('Fooo'));
  });
});
