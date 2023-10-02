import { render } from '@testing-library/react-native';
import fetchMock from 'jest-fetch-mock';
import React from 'react';
import { InitResponse } from 'statsig-test-helpers';

import App from '../App';

describe('App', () => {
  beforeAll(() => {
    fetchMock.mockResponse(JSON.stringify(InitResponse));
  });

  it('renders the Passing value', async () => {
    const { findByText } = render(<App />);
    const result = await findByText('a_gate: Passing');
    expect(result).toBeDefined();
  });
});
