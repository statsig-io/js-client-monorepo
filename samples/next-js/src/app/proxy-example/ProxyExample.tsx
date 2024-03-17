'use client';

import { useContext, useMemo } from 'react';
import { StatsigUser } from 'statsig-node';

import { StatsigClient } from '@statsig/js-client';
import {
  StatsigContext,
  StatsigProvider,
  useGate,
  useStatsigClient,
  useStatsigUser,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

function useBootstrappedClient(
  sdkKey: string,
  user: StatsigUser,
  values: string,
): StatsigClient {
  const client = useMemo(() => {
    const client = new StatsigClient(sdkKey, user, {
      api: 'http://localhost:4200/api/statsig',
    });
    client.dataAdapter.setData(values, user);
    client.initializeSync();
    return client;
  }, [sdkKey, user, values]);

  return client;
}

function UserDisplay() {
  const { user } = useStatsigUser();
  const { renderVersion } = useContext(StatsigContext);

  return (
    <div>
      <p>UserID: {user.userID}</p>
      <p>Version: {renderVersion}</p>
    </div>
  );
}

function Content() {
  const { value, details } = useGate('a_gate');
  const client = useStatsigClient();

  return (
    <div style={{ padding: 16 }}>
      <UserDisplay />
      <div>
        a_gate: {value ? 'Passing' : 'Failing'} ({details.reason})
      </div>
      <button
        onClick={() => {
          client.updateUserSync({ userID: 'second-user' });
        }}
      >
        Switch User
      </button>

      <button
        onClick={() => {
          client.updateUserAsync({ userID: 'second-user' }).catch((e) => {
            // eslint-disable-next-line no-console
            console.error(e);
          });
        }}
      >
        Switch User and Fetch Latest
      </button>
      <button
        onClick={() => {
          localStorage.clear();
          location.reload();
        }}
      >
        Clear Cache and Reload
      </button>
    </div>
  );
}

export default function ProxyExample({
  user,
  values,
}: {
  user: StatsigUser;
  values: string;
}): JSX.Element {
  const client = useBootstrappedClient(DEMO_CLIENT_KEY, user, values);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}