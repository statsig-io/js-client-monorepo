import React from 'react';
import { Text, View } from 'react-native';

import { useGate } from '@sigstat/react-native-bindings';

export default function GateHookExample(): React.ReactNode {
  const { value } = useGate('a_gate');

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        a_gate: {value ? 'Passing' : 'Failing'}
      </Text>
    </View>
  );
}
