'use client';

import React, { useState } from 'react';

import {
  StickyValues,
  UserPersistedValues,
  UserPersistentOverrideAdapter,
  UserPersistentStorage,
} from '@statsig/js-user-persisted-storage';
import {
  StatsigProviderOnDeviceEval,
  useExperiment,
  useOnDeviceClientAsyncInit,
} from '@statsig/react-bindings-on-device-eval';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

const CONTROL_GROUP_USERID = 'control-group-user-3';
const TEST_GROUP_USERID = 'test-group-user-11';

class InMemoryUserPersistedStorage implements UserPersistentStorage {
  inMemoryValues: Record<string, UserPersistedValues> = {};

  delete(key: string, experiment: string): void {
    delete this.inMemoryValues[key][experiment];
  }

  load(key: string): UserPersistedValues {
    return this.inMemoryValues[key];
  }

  save(key: string, experiment: string, data: string): void {
    const found = this.inMemoryValues[key] ?? {};
    found[experiment] = JSON.parse(data) as StickyValues;
    this.inMemoryValues[key] = found;
  }

  loadAsync(key: string): Promise<UserPersistedValues> {
    return Promise.resolve(this.load(key));
  }
}

function useUserPersistentOverrideAdapter(): UserPersistentOverrideAdapter {
  const [adapter] = useState(() => {
    const storage = new InMemoryUserPersistedStorage();
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

  const experiment = useExperiment('an_experiment', user, {
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
  const { client, isLoading } = useOnDeviceClientAsyncInit(DEMO_CLIENT_KEY, {
    overrideAdapter,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <StatsigProviderOnDeviceEval client={client}>
      <Content overrideAdapter={overrideAdapter} />
    </StatsigProviderOnDeviceEval>
  );
}
