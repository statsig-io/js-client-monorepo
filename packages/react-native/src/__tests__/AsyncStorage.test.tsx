import * as React from 'react';
import { View, Text } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';

describe('StatsigProvider', () => {
  it('renders children', async () => {
    render(
      <View>
        <Text>Fooo</Text>
      </View>,
    );

    await waitFor(() => screen.getByText('Fooo'));
  });
});
