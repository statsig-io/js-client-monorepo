import { Box, TextField, Typography } from '@mui/material';
import { ReactNode, useState } from 'react';

import {
  PrecomputedEvaluationsClient,
  StatsigUser,
} from '@statsig/precomputed-evaluations';
import { StatsigProvider, useGate } from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY } from './Contants';

const client = new PrecomputedEvaluationsClient(STATSIG_CLIENT_KEY);

// eslint-disable-next-line no-console
client.on('status_change', (data) => console.log(data));

let version = 1;
const statuses: string[] = [];

function VersionCounter() {
  version++;

  return <Typography> - Version: {version}</Typography>;
}

function Content({
  user,
  setUser,
}: {
  user: StatsigUser;
  setUser: (user: StatsigUser) => void;
}) {
  const gate = useGate('third_gate');

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      bgcolor={'rgba(255,255,255,0.4)'}
      height="200px"
      width="300px"
      padding="16px"
    >
      <Typography> - Result: {gate.value ? 'Pass' : 'Fail'}</Typography>
      <Typography> - Source: {gate.source}</Typography>
      <Typography> - Version: {JSON.stringify(statuses)}</Typography>

      <TextField
        label="UserID"
        value={user.userID}
        size="small"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setUser({ ...user, userID: event.target.value });
        }}
      />

      <TextField
        label="Email"
        value={user.email ?? ''}
        size="small"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setUser({ ...user, email: event.target.value });
        }}
      />
    </Box>
  );
}

export default function UpdatingUserExample(): ReactNode {
  const [user, setUser] = useState<StatsigUser>({ userID: 'a-user' });

  return (
    <StatsigProvider client={client} user={user}>
      <VersionCounter></VersionCounter>
      <Content user={user} setUser={setUser} />
    </StatsigProvider>
  );
}
