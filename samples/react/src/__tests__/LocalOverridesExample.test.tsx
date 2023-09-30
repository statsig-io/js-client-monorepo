import { render } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';

import LocalOverridesExample from '../LocalOverridesExample';

describe('App', () => {
  beforeAll(() => {
    fetchMock.mockResponse('{"has_updates": false}');
  });

  it('renders the Passing value', async () => {
    const { findByText } = render(<LocalOverridesExample />);
    const result = await findByText(/{"a_string":"overridden_string"}/);
    expect(result).toBeDefined();
  });
});
