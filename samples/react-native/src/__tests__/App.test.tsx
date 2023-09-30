import { render } from '@testing-library/react-native';
import React from 'react';

import App from '../App';

describe('App', () => {
  beforeAll(() => {
    // fetchMock.mockResponse(JSON.stringify(InitResponse));
  });

  it('renders the Passing value', async () => {
    const { findByText } = render(<App />);
    const result = await findByText('Foo');
    expect(result).toBeDefined();
  });
});
