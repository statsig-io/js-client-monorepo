'use client';

import React, { useContext } from 'react';
import { StatsigUser } from 'statsig-node';

import {
  StatsigContext,
  StatsigProvider,
  useClientBootstrapInit,
  useFeatureGate,
  useStatsigClient,
  useStatsigUser,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

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
  const { value, details } = useFeatureGate('a_gate');
  const { client } = useStatsigClient();

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
}): React.ReactElement {
  const client = useClientBootstrapInit(DEMO_CLIENT_KEY, user, values, {
    networkConfig: {
      api: 'http://localhost:4200/api/statsig',
    },
    disableStatsigEncoding: true,
    disableCompression: true,
  });

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
