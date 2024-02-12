import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { ReactNode, useState } from 'react';

import {
  PrecomputedEvaluationsClient,
  PrefetchEvaluationDataProvider,
} from '@sigstat/precomputed-evaluations';
import { StatsigProvider, useGate } from '@sigstat/react-bindings';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const user = { userID: 'a-user' };

const prefetchProvider = new PrefetchEvaluationDataProvider(DEMO_CLIENT_KEY);

const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, user, {
  dataProviders: [prefetchProvider],
});

function Content({
  userID,
  setUserID,
}: {
  userID: string;
  setUserID: (id: string) => void;
}) {
  const [error, setError] = useState('');
  const gate = useGate('partial_gate');

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="250px"
      justifyContent="space-between"
    >
      <Typography>Compare Prefetching Before Switching</Typography>
      <Typography>partial_gate: {gate.value ? 'Pass' : 'Fail'}</Typography>

      <TextField
        variant="filled"
        label="UserID"
        value={userID}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setUserID(event.target.value);
        }}
      />
      <Button
        variant="contained"
        onClick={() => {
          prefetchProvider
            .prefetchEvaluationsForUser(DEMO_CLIENT_KEY, { userID })
            .catch(() => setError('prefetchEvaluationsForUser Failed'));
        }}
      >
        Prefetch User
      </Button>
      <Button
        variant="contained"
        onClick={() => {
          client
            .updateUser({ userID })
            .catch(() => setError('updateUser Failed'));
        }}
      >
        Switch To User
      </Button>
      {error !== '' && <Alert severity="error">{error}</Alert>}
    </Box>
  );
}

export default function PrefetchUsersExample(): ReactNode {
  const [userID, setUserID] = useState('user-b');

  return (
    <StatsigProvider client={client}>
      <Content userID={userID} setUserID={setUserID} />
    </StatsigProvider>
  );
}
