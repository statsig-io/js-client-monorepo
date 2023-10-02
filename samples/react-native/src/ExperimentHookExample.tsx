import { Text, VStack } from 'native-base';
import React from 'react';

import { useExperiment } from '@sigstat/react-native-bindings';

export default function ExperimentHookExample(): React.ReactNode {
  const { value } = useExperiment('an_experiment');

  return (
    <VStack>
      <Text fontSize="md" color="white">
        an_experiment:
      </Text>
      <Text fontSize="md" color="white">
        {JSON.stringify(value)}
      </Text>
    </VStack>
  );
}
