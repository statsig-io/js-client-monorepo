// pages/api/statsig-proxy/log_event.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { LogEventObject } from 'statsig-node';

import { logEvents } from '../../../lib/statsig-backend';

type LogEventBody = {
  events: LogEventObject[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(400).send('/log_event only supports POST');
    return;
  }

  const body: unknown = req.body;
  if (!body || typeof body !== 'string') {
    res.status(400).send('Request body is required');
    return;
  }

  const { events } = JSON.parse(body) as LogEventBody;

  await logEvents(events);

  res.status(202).send('{"success": true}');
}
