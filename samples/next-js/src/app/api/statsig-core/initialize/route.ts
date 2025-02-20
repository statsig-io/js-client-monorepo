import { StatsigUser } from '@statsig/statsig-node-core';

import { getStatsigValues } from '../../../../utils/statsig-server-core';

export async function POST(request: Request): Promise<Response> {
  const json = await request.json();
  const user = new StatsigUser(json.user);
  const values = await getStatsigValues(user);
  return new Response(values);
}
