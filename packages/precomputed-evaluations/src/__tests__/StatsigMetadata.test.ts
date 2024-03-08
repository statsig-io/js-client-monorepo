import fetchMock from 'jest-fetch-mock';

import { version } from '../../package.json';
import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';

describe('StatsigMetadata', () => {
  let body: Record<string, unknown>;

  beforeAll(async () => {
    fetchMock.mockResponse('{}');

    const client = new PrecomputedEvaluationsClient('', { userID: '' });
    await client.initializeAsync();

    const data = fetchMock.mock.calls?.[0]?.[1]?.body?.toString() ?? '{}';
    body = JSON.parse(data) as Record<string, unknown>;
  });

  it('has the correct sdkType', () => {
    expect(body['statsigMetadata']).toMatchObject({
      sdkType: 'js-precomputed-evaluations-client',
    });
  });

  it('has the correct sdkVersion', () => {
    expect(body['statsigMetadata']).toMatchObject({
      sdkVersion: version as string,
    });
  });
});
