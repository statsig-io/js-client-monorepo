import { StatsigUser } from '@statsig/statsig-node-core';

import {
  LogEventObject,
  logEvents,
} from '../../../../utils/statsig-server-core';

type LogEventBody = {
  events: LogEventObject[];
};

export async function POST(request: Request): Promise<Response> {
  const json = await request.json();
  json.events.forEach((event: any) => {
    // Assemble the StatsigUser object manually
    const user = new StatsigUser({
      userID: event.user.userID, // Assuming 'id' is the property for user ID
      customIDs: event.user.customIDs,
    });

    // Update the event object to include the user
    event.user = user;
  });

  const body = json as LogEventBody;

  await logEvents(body.events);

  return new Response('{"success": true}');
}
