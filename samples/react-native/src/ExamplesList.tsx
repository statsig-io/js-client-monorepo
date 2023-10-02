import { Heading, SectionList } from 'native-base';
import React from 'react';

import ExperimentHookExample from './ExperimentHookExample';
import GateHookExample from './GateHookExample';
import UpdateUserExample from './UpdateUserExample';

const EXAMPLES = [
  {
    group: 'User',
    data: [<UpdateUserExample />],
  },
  {
    group: 'Gates',
    data: [
      <GateHookExample gateName="a_gate" />,
      <GateHookExample gateName="partial_gate" />,
    ],
  },
  {
    group: 'Experiments',
    data: [<ExperimentHookExample />],
  },
];

export default function ExamplesList(): React.ReactNode {
  return (
    <SectionList
      padding="16px"
      sections={EXAMPLES}
      keyExtractor={(_item, index) => index + ''}
      renderItem={({ item }) => item}
      renderSectionHeader={({ section: { group } }) => (
        <Heading fontSize="xl" mt="8" pb="4" color="white">
          {group}
        </Heading>
      )}
    />
  );
}
