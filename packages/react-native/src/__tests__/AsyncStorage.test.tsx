import AsyncStorageMock from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { StatsigRemoteServerEvalClient } from 'dloomb-client-remote-server-eval';
import fetchMock from 'jest-fetch-mock';

AsyncStorageMock.getItem = jest.fn(() => Promise.resolve(null));

describe('AsyncStorage', () => {
  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse('{}');
    const client = new StatsigRemoteServerEvalClient('client-key', {});
    await client.initialize();
    await client.shutdown();
  });

  it('calls AsyncStorage', () => {
    expect(AsyncStorageMock.getItem).toHaveBeenCalled();
  });
});
