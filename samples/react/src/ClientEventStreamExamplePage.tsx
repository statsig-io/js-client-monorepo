import { Box, Button, Typography } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';

import { AnyStatsigClientEvent } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider } from '@statsig/react-bindings';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const user = { userID: 'a-user' };

const client = new StatsigClient(DEMO_CLIENT_KEY, user, {});

function Content({ events }: { events: AnyStatsigClientEvent[] }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      alignItems="center"
    >
      <Button
        variant="contained"
        onClick={() => client.checkGate('a_gate')}
        sx={{ width: 250, marginBottom: '4px' }}
      >
        Check Gate
      </Button>
      <Button
        variant="contained"
        onClick={() => client.logEvent({ eventName: 'my_event' })}
        sx={{ width: 250 }}
      >
        Log Event
      </Button>
      <Box
        bgcolor="rgba(0,0,0,0.1)"
        width="400px"
        height="400px"
        padding="8px"
        position="relative"
        sx={{ overflowY: 'scroll' }}
      >
        <Box>
          {events.map((data, i) => (
            <Box
              key={`${data.name}-${i}`}
              padding="4px 8px"
              bgcolor="#194b7d"
              marginBottom="8px"
            >
              <Typography variant="subtitle1">{data.name}</Typography>
              <pre>
                {JSON.stringify({ ...data, event: undefined }, null, 2)}
              </pre>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function ClientEventStreamExample(): ReactNode {
  const [events, setEvents] = useState<AnyStatsigClientEvent[]>([]);

  useEffect(() => {
    const onFlush = (event: AnyStatsigClientEvent) => {
      setEvents((old) => [...old, event]);
    };

    client.on('*', onFlush);

    return () => client.off('*', onFlush);
  }, []);

  return (
    <StatsigProvider client={client}>
      <Content events={events} />
    </StatsigProvider>
  );
}
