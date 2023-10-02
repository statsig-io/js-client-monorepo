import { Center, Heading, SectionList } from 'native-base';
import React from 'react';

import GateHookExample from './GateHookExample';

const EXAMPLES = [
  {
    group: 'Gates',
    data: [<GateHookExample />],
  },
];

export default function ExamplesList(): React.ReactNode {
  return (
    <Center h="80" w="100%">
      <SectionList
        maxW="300"
        w="100%"
        mb="4"
        sections={EXAMPLES}
        keyExtractor={(_item, index) => index + ''}
        renderItem={({ item }) => item}
        renderSectionHeader={({ section: { group } }) => (
          <Center>
            <Heading fontSize="xl" mt="8" pb="4" color="white">
              {group}
            </Heading>
          </Center>
        )}
      />
    </Center>
  );
}
