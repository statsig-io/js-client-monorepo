import { Box, Button, TextField, Typography } from '@mui/material';
import { ReactNode, useState } from 'react';

import {
  EvaluationsDataAdapter,
  PrecomputedEvaluationsClient,
  StatsigUser,
} from '@statsig/precomputed-evaluations';
import {
  StatsigProvider,
  useGate,
  useStatsigUser,
} from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY } from './Contants';

const storageKey = 'fake_logged_in_user';

const authService = {
  getUser: () => {
    const data = localStorage.getItem(storageKey);
    if (!data) {
      return { userID: '' };
    }

    return JSON.parse(data) as StatsigUser;
  },
  login: async (email: string) => {
    await new Promise<void>((r) => setTimeout(r, 1000));
    const userID = `user-${btoa(email)}`;
    const user = { userID, email };
    localStorage.setItem(storageKey, JSON.stringify(user));
    return user;
  },
  logout: () => {
    localStorage.removeItem(storageKey);
  },
};

const dataAdapter = new EvaluationsDataAdapter();
const client = new PrecomputedEvaluationsClient(
  STATSIG_CLIENT_KEY,
  authService.getUser(),
  { dataAdapter },
);
client.initializeSync();

// eslint-disable-next-line no-console
client.on('values_updated', (data) => console.log(data));

let renderCount = 0;

function Content() {
  const { user } = useStatsigUser();

  const [isLoading, setIsLoading] = useState(false);
  const [formEmail, setFormEmail] = useState(user.email ?? '');
  const gate = useGate('third_gate'); // gate passes with non-empty email

  renderCount++;

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      bgcolor={'rgba(255,255,255,0.4)'}
      height="240px"
      padding="16px"
    >
      <Typography>Render Count: {renderCount}</Typography>
      <Typography>UserID: {!user.userID ? 'N/A' : user.userID}</Typography>
      <Typography>
        Gate: {gate.value ? 'Passing' : 'Failing'} ({gate.details.reason})
      </Typography>

      <TextField
        label="Email"
        value={formEmail}
        size="small"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setFormEmail(event.target.value);
        }}
      />

      <Button
        variant="contained"
        onClick={() => {
          setIsLoading(true);

          authService
            .login(formEmail)
            .then(async (authedUser) => {
              await dataAdapter.prefetchDataForUser(authedUser);
              return authedUser;
            })
            .then((authedUser) => client.updateUserSync(authedUser))
            .catch((err) => {
              throw err;
            })
            .finally(() => {
              setIsLoading(false);
            });
        }}
        disabled={isLoading || user.userID !== ''}
      >
        Login
      </Button>

      <Button
        variant="contained"
        onClick={() => {
          authService.logout();
          setFormEmail('');
          client.updateUserSync(authService.getUser());
        }}
        disabled={isLoading || user.userID === ''}
      >
        Logout
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
