// pages/api/statsig-proxy/log_event.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type ExtendedRequestInit = RequestInit & {
  duplex?: 'half' | 'full';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(400).send('/log_event only supports POST');
    return;
  }

  let logEventUrl = `https://events.statsigapi.net/v1/log_event`;
  const queryParams = [];
  for (const [key, value] of Object.entries(req.query)) {
    queryParams.push(`${key}=${value}`);
  }

  if (queryParams.length > 0) {
    logEventUrl += '?' + queryParams.join('&');
  }

  const fetchOptions: ExtendedRequestInit = {
    method: 'POST',
    body: req.body as BodyInit,
    headers: req.headers as HeadersInit,
    duplex: 'half',
  };

  try {
    const response = await fetch(logEventUrl, fetchOptions);
    if (!response.ok) {
      res.status(500).send('Failed to log event');
      return;
    }

    const body = await response.text();
    res.status(response.status).send(body);
  } catch (err) {
    res.status(500).send('Failed to log event: ' + err);
  }
}
