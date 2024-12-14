import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';

import { AnyStatsigClientEvent, LogLevel } from '@statsig/client-core';
import {
  StatsigProviderRN,
  useStatsigClient,
} from '@statsig/react-native-bindings';

import { DEMO_CLIENT_KEY } from './Constants';

function ClientEventItem({ event }: { event: AnyStatsigClientEvent }) {
  return (
    <View style={styles.item}>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.subtitle}>
        {JSON.stringify({ ...event, event: undefined }, null, 2)}
      </Text>
    </View>
  );
}

function Content() {
  const { client } = useStatsigClient();
  const [events, setEvents] = useState<AnyStatsigClientEvent[]>([]);

  useEffect(() => {
    const onClientEvent = (event: AnyStatsigClientEvent) => {
      setEvents((old) => [...old, event]);
    };

    client.on('*', onClientEvent);
    return () => client.off('*', onClientEvent);
  }, [client]);

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Text style={{ fontWeight: 'bold' }}>Client Event Stream Example</Text>
        <Button title="Check Gate" onPress={() => client.checkGate('a_gate')} />
        <Button
          title="Log Event"
          onPress={() => client.logEvent({ eventName: 'my_event' })}
        />
      </View>
      <FlatList
        style={styles.list}
        data={events}
        renderItem={({ item }) => <ClientEventItem event={item} />}
        keyExtractor={(item, index) => `${item}-${index}`}
      />
    </View>
  );
}

export default function ClientEventStreamExample(): React.ReactElement {
  return (
    <StatsigProviderRN
      sdkKey={DEMO_CLIENT_KEY}
      user={{ userID: 'a-user' }}
      options={{ logLevel: LogLevel.Debug }}
      loadingComponent={<Text>Loading...</Text>}
    >
      <Content />
    </StatsigProviderRN>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttons: {
    padding: 8,
  },
  list: {
    backgroundColor: '#eaeaea',
    padding: 8,
  },
  item: {
    padding: 8,
    marginVertical: 4,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
  },
});
