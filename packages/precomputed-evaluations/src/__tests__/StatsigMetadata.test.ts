import fetchMock from 'jest-fetch-mock';

import { version } from '../../package.json';
import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';

describe('StatsigMetadata', () => {
  const client = new PrecomputedEvaluationsClient('client-key');
  let body: Record<string, unknown>;

  beforeAll(async () => {
    fetchMock.mockResponse('{}');
    await client.initialize({ userID: '' });

    body = JSON.parse(
      fetchMock.mock.calls[0][1]?.body?.toString() ?? '{}',
    ) as typeof body;
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
