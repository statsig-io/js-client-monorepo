import { LogEventObject } from 'statsig-node';

import { logEvents } from '../../../../utils/statsig-server';

type LogEventBody = {
  events: LogEventObject[];
};

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as LogEventBody;

  await logEvents(body.events);

  return new Response('{"success": true}');
}
