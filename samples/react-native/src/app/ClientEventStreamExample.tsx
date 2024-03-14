import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';

import { LogLevel, StatsigClientEventData } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import {
  StatsigProviderRN,
  warmCachingFromAsyncStorage,
} from '@statsig/react-native-bindings';

import { DEMO_CLIENT_KEY } from './Constants';

const user = { userID: 'a-user' };
const client = new StatsigClient(DEMO_CLIENT_KEY, user, {
  logLevel: LogLevel.Debug,
});
const warming = warmCachingFromAsyncStorage(client);
client.initializeSync();

function ClientEventItem({ data }: { data: StatsigClientEventData }) {
  return (
    <View style={styles.item}>
      <Text style={styles.title}>{data.event}</Text>
      <Text style={styles.subtitle}>
        {JSON.stringify({ ...data, event: undefined }, null, 2)}
      </Text>
    </View>
  );
}

function Content({ events }: { events: StatsigClientEventData[] }) {
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
        renderItem={({ item }) => <ClientEventItem data={item} />}
        keyExtractor={(item, index) => `${item}-${index}`}
      />
    </View>
  );
}

export default function ClientEventStreamExample(): JSX.Element {
  const [events, setEvents] = useState<StatsigClientEventData[]>([]);
  useEffect(() => {
    const onClientEvent = (data: StatsigClientEventData) => {
      setEvents((old) => [...old, data]);
    };

    client.on('*', onClientEvent);

    return () => {
      client.off('*', onClientEvent);
    };
  }, []);

  return (
    <StatsigProviderRN client={client} cacheWarming={warming}>
      <Content events={events} />
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
