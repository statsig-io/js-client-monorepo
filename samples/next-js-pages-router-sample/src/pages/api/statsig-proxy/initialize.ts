// pages/api/statsig-proxy/initialize.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { StatsigUser } from 'statsig-node';

import { getStatsigValues } from '../../../lib/statsig-backend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(400).send('/initialize only supports POST');
    return;
  }

  const body: unknown = req.body;
  if (!body || typeof body !== 'string') {
    res.status(400).send('Request body is required');
    return;
  }

  const { user } = JSON.parse(body) as { user: StatsigUser };
  const data = await getStatsigValues(user);

  res.status(200).send(data);
}
