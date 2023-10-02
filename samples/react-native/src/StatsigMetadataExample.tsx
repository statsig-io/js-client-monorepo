import { Heading } from 'native-base';
import React from 'react';
import { Text, View } from 'react-native';

import { StatsigMetadata } from '@sigstat/core';

export default function StatsigMetadataExample(): React.ReactNode {
  return (
    <View>
      <Heading size="md" color="white">
        Statsig Metadata
      </Heading>
      <Text style={{ color: 'white' }}>
        {JSON.stringify(StatsigMetadata.get(), null, 2)}
      </Text>
    </View>
  );
}
