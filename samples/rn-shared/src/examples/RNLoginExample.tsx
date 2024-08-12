import { useEffect, useMemo, useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';

import { StatsigClient } from '@statsig/js-client';
import { useStatsigClient } from '@statsig/react-bindings';
import {
  StatsigProviderRN,
  useFeatureGate,
  warmCachingFromAsyncStorage,
} from '@statsig/react-native-bindings';

import { DEMO_CLIENT_KEY } from '../Constants';
import { AuthService } from '../DummyAuthService';

type Props = {
  onBackPress: () => void;
};

function Content() {
  const gate = useFeatureGate('third_gate'); // gate passes with non-empty email
  const { client } = useStatsigClient();

  return (
    <>
      <Text>
        third_gate: {gate.value ? 'Pass' : 'Fail'} ({gate.details.reason})
      </Text>
      <Text>{JSON.stringify(client.getContext().user)}</Text>
      <Button
        title="Logout"
        onPress={() => {
          AuthService.logout();
          client.updateUserSync({ userID: '' });
        }}
      ></Button>
    </>
  );
}

function LoginForm({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState('');

  return (
    <View>
      <View
        style={{ padding: 4, backgroundColor: 'rgba(0,0,0,0.1)', margin: 4 }}
      >
        <TextInput
          style={{ height: 30 }}
          value={email}
          placeholder="Email"
          onChangeText={(text) => setEmail(text)}
        />
      </View>
      <Button title="Login" onPress={() => onSubmit(email)}></Button>
    </View>
  );
}

export function RNLoginExample({ onBackPress }: Props): React.ReactNode {
  const { client, warming } = useMemo(() => {
    const client = new StatsigClient(DEMO_CLIENT_KEY, { userID: '' });
    const warming = warmCachingFromAsyncStorage(client);

    return { client, warming };
  }, []);

  useEffect(() => {
    AuthService.getUser()
      .then((u) => client.updateUserSync(u))
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error(e);
      });
  }, [client]);

  return (
    <StatsigProviderRN client={client} cacheWarming={warming}>
      <Button title="Back" onPress={onBackPress}></Button>

      <LoginForm
        onSubmit={(email) => {
          AuthService.login({ email, password: '' })
            .then((result) => {
              return client.updateUserAsync(result.authorizedUser);
            })
            .catch((e) => {
              // eslint-disable-next-line no-console
              console.error(e);
            });
        }}
      />

      <Content />
    </StatsigProviderRN>
  );
}
