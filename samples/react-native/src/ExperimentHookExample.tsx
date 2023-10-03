import { Text, VStack } from 'native-base';
import React from 'react';

import { useExperiment } from '@sigstat/react-native-bindings';

export default function ExperimentHookExample({
  experimentName,
}: {
  experimentName: string;
}): React.ReactNode {
  const { value } = useExperiment(experimentName);

  return (
    <VStack>
      <Text fontSize="md" color="white">
        {experimentName}:
      </Text>
      <Text fontSize="md" color="white">
        {JSON.stringify(value)}
      </Text>
    </VStack>
  );
}
