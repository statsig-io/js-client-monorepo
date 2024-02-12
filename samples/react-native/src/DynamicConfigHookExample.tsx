import { Text, VStack } from 'native-base';
import React from 'react';

import { useDynamicConfig } from '@sigstat/react-native-bindings';

export default function DynamicConfigHookExample({
  configName,
}: {
  configName: string;
}): React.ReactNode {
  const config = useDynamicConfig(configName);

  return (
    <VStack>
      <Text fontSize="md" color="white">
        {configName}:
      </Text>
      <Text fontSize="md" color="white">
        {JSON.stringify(config)}
      </Text>
    </VStack>
  );
}
