import fetchMock from 'jest-fetch-mock';

import { version } from '../../package.json';
import StatsigClient from '../StatsigClient';

describe('StatsigMetadata', () => {
  let body: Record<string, unknown>;

  beforeAll(async () => {
    __STATSIG__ = { 'no-encode': 1 };
    fetchMock.mockResponse('{}');

    const client = new StatsigClient('', { userID: '' });
    await client.initializeAsync();

    const data = fetchMock.mock.calls?.[0]?.[1]?.body?.toString() ?? '{}';
    body = JSON.parse(data) as Record<string, unknown>;
  });

  it('has the correct sdkType', () => {
    expect(body['statsigMetadata']).toMatchObject({
      sdkType: 'javascript-client',
    });
  });

  it('has the correct sdkVersion', () => {
    expect(body['statsigMetadata']).toMatchObject({
      sdkVersion: version as string,
    });
  });
});
