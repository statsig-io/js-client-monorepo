import { render, waitFor } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import { StrictMode } from 'react';
import { InitResponse } from 'statsig-test-helpers';

import HomePage from '../HomePage';

describe('App', () => {
  beforeAll(() => {
    fetchMock.mockResponse(JSON.stringify(InitResponse));
  });

  it('renders the Passing value', async () => {
    const { getByText } = render(
      <StrictMode>
        <HomePage />
      </StrictMode>,
    );

    const result = await waitFor(() => getByText('Passing'));
    expect(result).toBeDefined();
  });
});
