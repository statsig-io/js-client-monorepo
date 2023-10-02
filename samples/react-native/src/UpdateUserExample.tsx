import { HStack, IconButton, PlayIcon, Text } from 'native-base';
import React, { useContext, useState } from 'react';

import {
  PrecomputedEvaluationsClient,
  StatsigUser,
} from '@sigstat/precomputed-evaluations';
import { StatsigContext } from '@sigstat/react-native-bindings';

export default function UpdateUserExample(): React.ReactNode {
  const { client } = useContext(StatsigContext);
  const [user, setUser] = useState((client as any)._user as StatsigUser);

  if (!(client instanceof PrecomputedEvaluationsClient)) {
    return null;
  }

  return (
    <HStack justifyContent="space-between" alignItems="center">
      <Text color="white">{user.userID}</Text>
      <IconButton
        icon={<PlayIcon size="7" />}
        color="white"
        onPress={() => {
          const uuid = Math.random().toString(36).slice(-6);

          client
            .updateUser({ userID: 'user-' + uuid })
            .then(() => {
              setUser((client as any)._user as StatsigUser);
            })
            .catch(() => {
              //noop
            });
        }}
      />
    </HStack>
  );
}
