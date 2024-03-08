import { Box, Button, TextField, Typography } from '@mui/material';
import { ReactNode, useState } from 'react';

import { getUUID } from '@statsig/client-core';
import {
  PrecomputedEvaluationsClient,
  StatsigUser,
} from '@statsig/precomputed-evaluations';
import { StatsigProvider, useGate } from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY } from './Contants';

const initialUser = {
  customIDs: {
    anonymousID: getUUID(),
  },
};

const client = new PrecomputedEvaluationsClient(
  STATSIG_CLIENT_KEY,
  initialUser,
);

// eslint-disable-next-line no-console
client.on('status_change', (data) => console.log(data));

// Add fake delay in network
const actual = window.fetch;
window.fetch = async (url, data) => {
  await new Promise<void>((r) => setTimeout(r, 1000));
  return actual(url, data);
};

function Content() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<StatsigUser>(initialUser);
  const gate = useGate('third_gate'); // gate passes with non-empty email

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      bgcolor={'rgba(255,255,255,0.4)'}
      height="300px"
      padding="16px"
    >
      <Typography>Anon ID: {user.customIDs?.['anonymousID']}</Typography>
      <Typography>
        Gate: {gate.value ? 'Passing' : 'Failing'} ({gate.details.reason})
      </Typography>

      <TextField
        label="Email"
        value={user.email ?? ''}
        size="small"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setUser((user) => ({ ...user, email: event.target.value }));
        }}
      />

      <Button
        variant="contained"
        onClick={() => {
          setIsLoading(true);

          client
            .updateUserAsync(user)
            .catch((err) => {
              throw err;
            })
            .finally(() => {
              setIsLoading(false);
            });
        }}
        disabled={isLoading}
      >
        Login
      </Button>
    </Box>
  );
}

export default function TransitionToLoggedInExample(): ReactNode {
  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
