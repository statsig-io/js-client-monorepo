import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';

import { RNBootstrapExample } from './examples/RNBootstrapExample';
import { RNLoginExample } from './examples/RNLoginExample';

const fruits = [
  { name: 'Bootstrapping' },
  { name: 'Login Flow' },
  { name: 'Login Flo2w' },
];

export function SampleListView(): React.ReactNode {
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  const onBackPress = () => setSelectedExample(null);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {(() => {
          switch (selectedExample) {
            case 'Bootstrapping':
              return <RNBootstrapExample onBackPress={onBackPress} />;

            case 'Login Flow':
              return <RNLoginExample onBackPress={onBackPress} />;

            default:
              return (
                <FlatList
                  data={fruits}
                  renderItem={(args) => (
                    <TouchableOpacity
                      style={{ padding: 10, borderBottomWidth: 1 }}
                      onPress={() => setSelectedExample(args.item.name)}
                    >
                      <Text style={{ fontSize: 18 }}>{args.item.name}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.name.toString()}
                />
              );
          }
        })()}
      </SafeAreaView>
    </>
  );
}
