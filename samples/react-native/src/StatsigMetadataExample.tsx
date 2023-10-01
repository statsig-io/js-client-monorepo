import React from 'react';
import { Text, View } from 'react-native';

import { StatsigMetadata } from '@sigstat/core';

export default function StatsigMetadataExample(): React.ReactNode {
  return (
    <View>
      <Text style={{ color: 'white' }}>Statsig Metadata</Text>
      <Text style={{ color: 'white' }}>
        {JSON.stringify(StatsigMetadata.get(), null, 2)}
      </Text>
    </View>
  );
}
