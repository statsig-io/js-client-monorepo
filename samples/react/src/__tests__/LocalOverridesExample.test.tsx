import { RenderResult, render } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';

import LocalOverridesExample from '../LocalOverridesExample';

describe('App', () => {
  beforeAll(() => {
    fetchMock.mockResponse('{"has_updates": false}');
  });

  it('renders the overridden_gate value', async () => {
    const { findByText } = render(<LocalOverridesExample />);
    const result = await findByText(/overridden_gate: Pass/);
    expect(result).toBeDefined();
  });

  it('renders the overridden_experiment value', async () => {
    const { findByText } = render(<LocalOverridesExample />);
    const result = await findByText(
      /overridden_experiment: {"a_string":"overridden_string"}/,
    );
    expect(result).toBeDefined();
  });
});
