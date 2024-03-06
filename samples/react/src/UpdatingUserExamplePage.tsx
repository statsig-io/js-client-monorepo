import { Box, Button, TextField, Typography } from '@mui/material';
import { ReactNode, useState } from 'react';

import { PrecomputedEvaluationsClient } from '@statsig/precomputed-evaluations';
import {
  StatsigProvider,
  useGate,
  useStatsigUser,
} from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY } from './Contants';

const client = new PrecomputedEvaluationsClient(STATSIG_CLIENT_KEY, {
  userID: 'a-user',
});

// eslint-disable-next-line no-console
client.on('status_change', (data) => console.log(data));

let renderCount = 0;

function Form() {
  const { user, updateUser } = useStatsigUser();
  const [editedUser, setEditedUser] = useState(user);
  const gate = useGate('third_gate');

  return (
    <>
      <Typography> - Result: {gate.value ? 'Pass' : 'Fail'}</Typography>
      <Typography> - Render Count: {renderCount}</Typography>
      <Typography> - Source: {gate.source}</Typography>

      <TextField
        label="UserID"
        value={editedUser.userID}
        size="small"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setEditedUser((user) => ({ ...user, userID: event.target.value }));
        }}
      />

      <TextField
        label="Email"
        value={editedUser.email ?? ''}
        size="small"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setEditedUser((user) => ({ ...user, email: event.target.value }));
        }}
      />

      <Button
        variant="contained"
        onClick={() => {
          // eslint-disable-next-line no-console
          updateUser((_user) => editedUser).catch((e) => console.error(e));
        }}
      >
        Apply Changes
      </Button>
    </>
  );
}

function Content() {
  renderCount++;

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      bgcolor={'rgba(255,255,255,0.4)'}
      height="300px"
      width="300px"
      padding="16px"
    >
      <Form />
    </Box>
  );
}

export default function UpdatingUserExample(): ReactNode {
  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
