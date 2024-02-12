import 'jest-fetch-mock';

import { Log } from '../Log';
import { NetworkCore } from '../NetworkCore';

Log.level = 'none';

describe('Network Core', () => {
  const url = 'http://localhost';
  const network = new NetworkCore();

  describe('Success', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockResponseOnce(JSON.stringify({ data: '12345' }));
      await network.post({ sdkKey: '', url, data: {} });
    });

    it('makes requests', () => {
      fetchMock.mockReject(new Error('Network Error'));
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('Error', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockReject(new Error('Lost Connection'));
      await network.post({ sdkKey: '', url, data: {}, retries: 2 });
    });

    it('make 1 initial and then 2 retries', () => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Failure', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockResponse('', { status: 500 });
      await network.post({ sdkKey: '', url, data: {}, retries: 2 });
    });

    it('make 1 initial and then 2 retries', () => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
