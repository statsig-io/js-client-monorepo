import { useMemo, useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';

import { StatsigClientEvent } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { StatsigProviderRN } from '@statsig/react-native-bindings';

import { DEMO_CLIENT_KEY } from '../Constants';

type Props = {
  onBackPress: () => void;
};

function Content({ events }: { events: StatsigClientEvent[] }) {
  return (
    <FlatList
      data={events}
      renderItem={(e) => (
        <View key={e.index} style={{ marginBottom: 10 }}>
          <Text>{e.item.name}</Text>
          <Text>{JSON.stringify(e.item, null, 2)}</Text>
        </View>
      )}
    ></FlatList>
  );
}

export function RNEventStream({ onBackPress }: Props): React.ReactNode {
  const [events, setEvents] = useState<StatsigClientEvent[]>([]);

  const { client } = useMemo(() => {
    const client = new StatsigClient(DEMO_CLIENT_KEY, { userID: 'a-user' });
    client.on('*', (e) => setEvents((o) => [...o, e]));
    return { client };
  }, []);

  return (
    <StatsigProviderRN client={client}>
      <View>
        <Button title="Back" onPress={onBackPress}></Button>
        <Button
          title="Log Event"
          onPress={() => client.logEvent('my_event')}
        ></Button>
        <Content events={events} />
      </View>
    </StatsigProviderRN>
  );
}
