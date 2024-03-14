import { Box, Button, Typography } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';

import { StatsigClientEventData } from '@statsig/client-core';
import { EvaluationsDataAdapter, StatsigClient } from '@statsig/js-client';
import { StatsigProvider } from '@statsig/react-bindings';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const user = { userID: 'a-user' };

const adapter = new EvaluationsDataAdapter();
const client = new StatsigClient(DEMO_CLIENT_KEY, user, {
  dataAdapter: adapter,
});

function Content({ events }: { events: StatsigClientEventData[] }) {
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
              key={`${data.event}-${i}`}
              padding="4px 8px"
              bgcolor="#194b7d"
              marginBottom="8px"
            >
              <Typography variant="subtitle1">{data.event}</Typography>
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
  const [events, setEvents] = useState<StatsigClientEventData[]>([]);

  useEffect(() => {
    const onFlush = (data: StatsigClientEventData) => {
      setEvents((old) => [...old, data]);
    };

    client.on('*', onFlush);

    return () => {
      client.off('*', onFlush);
    };
  }, []);

  return (
    <StatsigProvider client={client}>
      <Content events={events} />
    </StatsigProvider>
  );
}
