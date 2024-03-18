'use client';

import { useMemo, useState } from 'react';

import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';
import {
  StickyValues,
  UserPersistedValues,
  UserPersistentOverrideAdapter,
  UserPersistentStorage,
} from '@statsig/js-user-persisted-storage';
import { StatsigProvider, useExperiment } from '@statsig/react-bindings';

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
  return useMemo(() => {
    const storage = new InMemoryUserPersistedStorage();
    return new UserPersistentOverrideAdapter(storage);
  }, []);
}

function useUserPersistedStorageClient(
  sdkKey: string,
  overrideAdapter: UserPersistentOverrideAdapter,
): StatsigOnDeviceEvalClient {
  const client = useMemo(() => {
    const client = new StatsigOnDeviceEvalClient(sdkKey, {
      overrideAdapter,
    });
    client.initializeAsync().catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
    });
    return client;
  }, [sdkKey, overrideAdapter]);

  return client;
}

function Content(props: { overrideAdapter: UserPersistentOverrideAdapter }) {
  const [user, setUser] = useState({ userID: CONTROL_GROUP_USERID });
  const userPersistedValues = props.overrideAdapter.loadUserPersistedValues(
    user,
    'userID',
  );

  const experiment = useExperiment('an_experiment', {
    user,
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

export default function PersistedUserStorageExample(): JSX.Element {
  const adapter = useUserPersistentOverrideAdapter();
  const client = useUserPersistedStorageClient(DEMO_CLIENT_KEY, adapter);

  return (
    <StatsigProvider client={client}>
      <Content overrideAdapter={adapter} />
    </StatsigProvider>
  );
}
