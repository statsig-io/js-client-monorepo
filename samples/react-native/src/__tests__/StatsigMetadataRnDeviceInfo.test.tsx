import { render } from '@testing-library/react-native';
import fetchMock from 'jest-fetch-mock';
import React from 'react';
import { InitResponse } from 'statsig-test-helpers';

import App from '../App';

jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.2.3',
  getSystemVersion: () => '4.20.0',
  getSystemName: () => 'Android',
  getModel: () => 'Pixel 2',
  getDeviceId: () => 'goldfish',
}));

describe('StatsigMetadata - RN Device Info', () => {
  let body: Record<string, unknown>;

  beforeAll(async () => {
    fetchMock.mockResponse(JSON.stringify(InitResponse));
    const { findByText } = render(<App />);
    await findByText('Passing');

    body = JSON.parse(
      fetchMock.mock.calls[0][1]?.body?.toString() ?? '{}',
    ) as typeof body;
  });

  it('gets the expected metadata', () => {
    expect(body.statsigMetadata).toMatchObject({
      appVersion: '1.2.3',
      systemVersion: '4.20.0',
      systemName: 'Android',
      deviceModelName: 'Pixel 2',
      deviceModel: 'goldfish',
    });
  });
});
