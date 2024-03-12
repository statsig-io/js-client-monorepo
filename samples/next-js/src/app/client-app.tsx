'use client';

import { useContext, useEffect, useMemo } from 'react';
import { StatsigUser } from 'statsig-node';

import { StatsigClientEventData } from '@statsig/client-core';
import {
  EvaluationsDataAdapter,
  PrecomputedEvaluationsClient,
} from '@statsig/precomputed-evaluations';
import {
  StatsigContext,
  StatsigProvider,
  useGate,
  usePrecomputedEvaluationsClient,
  useStatsigUser,
} from '@statsig/react-bindings';

/* eslint-disable no-console */

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

function useBootstrappedClient(
  sdkKey: string,
  user: StatsigUser,
  values: string,
): PrecomputedEvaluationsClient {
  const client = useMemo(() => {
    const dataAdapter = new EvaluationsDataAdapter();
    const client = new PrecomputedEvaluationsClient(sdkKey, user, {
      dataAdapter,
    });
    dataAdapter.setDataForUser(user, values);
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
  const client = usePrecomputedEvaluationsClient();

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

export default function ClientApp({
  user,
  values,
}: {
  user: StatsigUser;
  values: string;
}): JSX.Element {
  const client = useBootstrappedClient(DEMO_CLIENT_KEY, user, values);

  useEffect(() => {
    const onClientEvent = (data: StatsigClientEventData) => console.log(data);
    client.on('*', onClientEvent);
    return () => client.off('*', onClientEvent);
  }, [client]);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
