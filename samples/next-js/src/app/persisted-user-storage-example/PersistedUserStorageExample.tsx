'use client';

import React, { useState } from 'react';

import {
  UserPersistedValues,
  UserPersistentOverrideAdapter,
  UserPersistentStorage,
} from '@statsig/js-user-persisted-storage';
import {
  StatsigProvider,
  useClientAsyncInit,
  useExperiment,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

const CONTROL_GROUP_USERID = 'control-group-user-3';
const TEST_GROUP_USERID = 'test-group-user-11';

class LocalStorageUserPersistedStorage implements UserPersistentStorage {
  delete(key: string, experiment: string): void {
    const data = JSON.parse(localStorage.getItem(key) ?? '{}');
    delete data[experiment];
    localStorage.setItem(key, JSON.stringify(data));
  }

  load(key: string): UserPersistedValues {
    return JSON.parse(localStorage.getItem(key) ?? '{}');
  }

  save(key: string, experiment: string, data: string): void {
    const values = JSON.parse(localStorage.getItem(key) ?? '{}');
    values[experiment] = JSON.parse(data);
    localStorage.setItem(key, JSON.stringify(values));
  }

  loadAsync(key: string): Promise<UserPersistedValues> {
    return Promise.resolve(this.load(key));
  }
}

function useUserPersistentOverrideAdapter(): UserPersistentOverrideAdapter {
  const [adapter] = useState(() => {
    const storage = new LocalStorageUserPersistedStorage();
    return new UserPersistentOverrideAdapter(storage);
  });

  return adapter;
}

function Content(props: { overrideAdapter: UserPersistentOverrideAdapter }) {
  const [user, setUser] = useState({ userID: CONTROL_GROUP_USERID });
  const userPersistedValues = props.overrideAdapter.loadUserPersistedValues(
    user,
    'userID',
  );

  const experiment = useExperiment('an_experiment', {
    userPersistedValues,
  });

  return (
    <div style={{ padding: 16 }}>
      <button
        onClick={() => {
          setUser((old) => ({
            userID:
              old.userID === CONTROL_GROUP_USERID
                ? TEST_GROUP_USERID
                : CONTROL_GROUP_USERID,
          }));
        }}
      >
        Switch User
      </button>

      <div>UserID: {user.userID}</div>

      <div style={{ display: 'flex' }}>
        <div style={{ marginRight: '4px' }}>
          <p>User Persistent Storage Values</p>
          <pre>
            <code>
              {JSON.stringify(props.overrideAdapter.storage, null, 2)}
            </code>
          </pre>
        </div>
        <div>
          <p>Current Experiment Values</p>
          <pre>
            <code>{JSON.stringify(experiment, null, 2)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function PersistedUserStorageExample(): React.ReactElement {
  const overrideAdapter = useUserPersistentOverrideAdapter();
  const { client, isLoading } = useClientAsyncInit(
    DEMO_CLIENT_KEY,
    { userID: CONTROL_GROUP_USERID },
    {
      overrideAdapter,
    },
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <StatsigProvider client={client}>
      <Content overrideAdapter={overrideAdapter} />
    </StatsigProvider>
  );
}
