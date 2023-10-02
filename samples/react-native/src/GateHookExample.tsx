import { Text } from 'native-base';
import React from 'react';

import { useGate } from '@sigstat/react-native-bindings';

export default function GateHookExample({
  gateName,
}: {
  gateName: string;
}): React.ReactNode {
  const { value } = useGate(gateName);

  return (
    <Text fontSize="md" color="white">
      {gateName}: {value ? 'Passing' : 'Failing'}
    </Text>
  );
}
