import React from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native';

export default function App(): React.ReactNode {
  return (
    <>
      <StatusBar hidden />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#194b7d' }}>
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
            Foo
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
