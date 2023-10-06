import { Heading } from 'native-base';
import React from 'react';
import { Text, View } from 'react-native';

import { StatsigMetadataProvider } from '@sigstat/core';

export default function StatsigMetadataExample(): React.ReactNode {
  return (
    <View>
      <Heading size="md" color="white">
        Statsig Metadata
      </Heading>
      <Text style={{ color: 'white' }}>
        {JSON.stringify(StatsigMetadataProvider.get(), null, 2)}
      </Text>
    </View>
  );
}
