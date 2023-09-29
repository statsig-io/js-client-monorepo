import { render } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import App from './App';

describe('App', () => {
  beforeAll(() => {
    fetchMock.enableMocks();
    fetchMock.mockResponse('{}');
  });

  it('should have a greeting as the title', async () => {
    const { findByText } = render(<App />);
    expect(findByText(/Welcome react-sample/)).resolves.toBeTruthy();
  });
});
