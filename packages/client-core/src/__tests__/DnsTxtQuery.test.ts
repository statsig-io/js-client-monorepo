import 'jest-fetch-mock';
import { anyStringContaining } from 'statsig-test-helpers';

import { _fetchTxtRecords } from '../DnsTxtQuery';

describe('DnsTxtQuery', () => {
  describe('real txt records', () => {
    let records: string[] | null;
    beforeAll(async () => {
      fetchMock.disableMocks();

      // makes a real network request
      records = await _fetchTxtRecords(fetch);
    });

    it('contains a initialize domain', async () => {
      expect(records).toContainEqual(anyStringContaining('i='));
    });

    it('contains a dcs domain', async () => {
      expect(records).toContainEqual(anyStringContaining('d='));
    });

    it('contains a events domain', async () => {
      expect(records).toContainEqual(anyStringContaining('e='));
    });
  });

  describe('dummy txt records', () => {
    let records: string[] | null;

    beforeAll(async () => {
      fetchMock.enableMocks();
      fetchMock.mockImplementation(() => {
        const encodedValues = Buffer.from(
          'featureassetsorgÀ,>=i=featureassets.org,d=api.statsigcdn.com,e=prodregistryv2.org',
          'binary',
        ).toString('utf-8');

        return Promise.resolve(new Response(encodedValues));
      });

      records = await _fetchTxtRecords(fetchMock);
    });

    it('contains a initialize domain', async () => {
      expect(records).toContain('i=featureassets.org');
    });

    it('contains a dcs domain', async () => {
      expect(records).toContain('d=api.statsigcdn.com');
    });

    it('contains a events domain', async () => {
      expect(records).toContain('e=prodregistryv2.org');
    });
  });

  describe('error handling', () => {
    beforeAll(() => {
      fetchMock.enableMocks();
    });

    it('throws when fetch fails', async () => {
      fetchMock.mockResponse('', { status: 500 });

      await expect(_fetchTxtRecords(fetchMock)).rejects.toThrow(
        'Failed to fetch TXT records from DNS',
      );
    });

    it('throws on invalid response', async () => {
      fetchMock.mockImplementation(() => {
        return Promise.resolve(new Response(new ArrayBuffer(0)));
      });

      await expect(_fetchTxtRecords(fetchMock)).rejects.toThrow(
        'Failed to parse TXT records from DNS',
      );
    });
  });
});
