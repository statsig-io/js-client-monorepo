import { render } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import { InitResponse } from 'statsig-test-helpers';

import HomePage from '../HomePage';

describe('App', () => {
  beforeAll(() => {
    fetchMock.mockResponse(JSON.stringify(InitResponse));
  });

  it('renders the Passing value', async () => {
    const { findByText } = render(<HomePage />);
    const result = await findByText('Passing');
    expect(result).toBeDefined();
  });
});
